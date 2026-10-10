package config

import (
	"bufio"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
)

// CleanDatabaseURL は接続文字列をGo (lib/pq) 向けに正規化します
// 1. Prisma用の `?pgbouncer=true` などの非対応パラメータを除去
// 2. SSL必須のSupabase用に `sslmode=require` を設定
func CleanDatabaseURL(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	rawURL = strings.Trim(rawURL, `"'`)
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	q := u.Query()
	q.Del("pgbouncer")
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "require")
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// ParseEnvContent は .env 形式のテキストから DATABASE_URL や DIRECT_URL を抽出します
func ParseEnvContent(content string) string {
	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "#") || line == "" {
			continue
		}
		if strings.HasPrefix(line, "DIRECT_URL=") {
			return strings.Trim(strings.TrimPrefix(line, "DIRECT_URL="), `"' `)
		}
		if strings.HasPrefix(line, "DATABASE_URL=") {
			return strings.Trim(strings.TrimPrefix(line, "DATABASE_URL="), `"' `)
		}
		// ファイル全体が単一の postgresql:// URL の場合
		if strings.HasPrefix(line, "postgresql://") || strings.HasPrefix(line, "postgres://") {
			return strings.Trim(line, `"' `)
		}
	}
	return ""
}

// ParseEnvKey は .env 形式のテキストから特定キーの値を抽出します
func ParseEnvKey(content, key string) string {
	scanner := bufio.NewScanner(strings.NewReader(content))
	prefix := key + "="
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "#") || line == "" {
			continue
		}
		if strings.HasPrefix(line, prefix) {
			return strings.Trim(strings.TrimPrefix(line, prefix), `"' `)
		}
	}
	return ""
}

// FindDatabaseURL は環境変数やシークレットファイルから接続文字列を探します
func FindDatabaseURL() string {
	// 1. 環境変数 DIRECT_URL
	if u := os.Getenv("DIRECT_URL"); u != "" {
		return u
	}
	// 2. 環境変数 DATABASE_URL
	if u := os.Getenv("DATABASE_URL"); u != "" {
		return u
	}
	// 3. 環境変数 env (Secret Managerからファイル全体が注入された場合)
	if envVal := os.Getenv("env"); envVal != "" {
		if parsed := ParseEnvContent(envVal); parsed != "" {
			return parsed
		}
		// そのままURL文字列である場合
		if strings.HasPrefix(envVal, "postgresql://") || strings.HasPrefix(envVal, "postgres://") {
			return envVal
		}
	}

	// 4. マウントされたファイルや .env
	candidatePaths := []string{".env", "../.env", "/secrets/env", "/secrets/.env"}
	for _, path := range candidatePaths {
		if data, err := os.ReadFile(path); err == nil {
			if parsed := ParseEnvContent(string(data)); parsed != "" {
				return parsed
			}
		}
	}

	return ""
}

// FindJWKSURL は SUPABASE_URL または DB接続文字列から JWKS (公開鍵) のURLを取得します
func FindJWKSURL(dbURL string) string {
	// 1. 環境変数 SUPABASE_URL
	if u := os.Getenv("SUPABASE_URL"); u != "" {
		return fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", strings.TrimRight(strings.TrimSpace(u), "/"))
	}

	// 2. 環境変数 env (Secret Managerからファイル全体が注入された場合)
	if envVal := os.Getenv("env"); envVal != "" {
		if u := ParseEnvKey(envVal, "SUPABASE_URL"); u != "" {
			return fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", strings.TrimRight(u, "/"))
		}
	}

	// 3. マウントされたファイルや .env
	candidatePaths := []string{".env", "../.env", "/secrets/env", "/secrets/.env"}
	for _, path := range candidatePaths {
		if data, err := os.ReadFile(path); err == nil {
			if u := ParseEnvKey(string(data), "SUPABASE_URL"); u != "" {
				return fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", strings.TrimRight(u, "/"))
			}
		}
	}

	// 4. フォールバック: 既存の DB 接続 URL (DIRECT_URL / DATABASE_URL) からプロジェクトIDを自動抽出
	if dbURL != "" {
		if idx := strings.Index(dbURL, "postgres."); idx != -1 {
			sub := dbURL[idx+len("postgres."):]
			endIdx := strings.IndexAny(sub, ":@")
			if endIdx != -1 {
				projectRef := sub[:endIdx]
				log.Printf("Auto-detected Supabase project ref from database URL: %s\n", projectRef)
				return fmt.Sprintf("https://%s.supabase.co/auth/v1/.well-known/jwks.json", projectRef)
			}
		}
	}

	return ""
}
