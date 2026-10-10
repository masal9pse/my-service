package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// SPAHandler はSPA用静的ファイル配信ハンドラーです（存在しないパスはindex.htmlを返却）
func SPAHandler(staticDir string) http.HandlerFunc {
	fs := http.Dir(staticDir)
	fileServer := http.FileServer(fs)

	return func(w http.ResponseWriter, r *http.Request) {
		// APIパスへのアクセスは404
		if strings.HasPrefix(r.URL.Path, "/api/") ||
			strings.HasPrefix(r.URL.Path, "/not-todos") ||
			strings.HasPrefix(r.URL.Path, "/not_todos") ||
			strings.HasPrefix(r.URL.Path, "/hello") {
			http.NotFound(w, r)
			return
		}

		path := filepath.Join(staticDir, filepath.Clean(r.URL.Path))
		info, err := os.Stat(path)
		if os.IsNotExist(err) || (err == nil && info.IsDir()) {
			indexPath := filepath.Join(staticDir, "index.html")
			if _, indexErr := os.Stat(indexPath); indexErr == nil {
				http.ServeFile(w, r, indexPath)
				return
			}
		}

		fileServer.ServeHTTP(w, r)
	}
}
