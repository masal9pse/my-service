import { useState, type ReactNode } from 'react'
import { Copy, Check, FileText } from 'lucide-react'

interface MarkdownViewerProps {
  content: string
  title?: string
}

// インラインマークダウンのパース（太字, 斜体, コード, リンク, 打消し）
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // 正規表現でトークン化: `code`, **bold**, *italic*, ~~del~~, [link](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      // Inline code
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono text-[0.85em] border border-zinc-700/60"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**') && token.endsWith('**')) {
      // Bold
      nodes.push(
        <strong key={`b-${match.index}`} className="font-bold text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic
      nodes.push(
        <em key={`i-${match.index}`} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      // Strike
      nodes.push(
        <del key={`del-${match.index}`} className="line-through text-zinc-500">
          {token.slice(2, -2)}
        </del>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      // Link [text](url)
      const closingBracket = token.indexOf('](')
      const linkText = token.slice(1, closingBracket)
      const linkUrl = token.slice(closingBracket + 2, -1)
      nodes.push(
        <a
          key={`a-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition"
        >
          {linkText}
        </a>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export function MarkdownViewer({ content, title = 'README.md' }: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ブロックレベルのパース
  const lines = content.split(/\r?\n/)
  const renderedElements: ReactNode[] = []

  let inCodeBlock = false
  let codeBlockLang = ''
  let codeBlockLines: string[] = []

  let inTable = false
  let tableRows: string[][] = []

  let inList = false
  let listItems: ReactNode[] = []
  let listIsOrdered = false

  const flushList = () => {
    if (inList) {
      if (listIsOrdered) {
        renderedElements.push(
          <ol
            key={`ol-${renderedElements.length}`}
            className="list-decimal list-inside space-y-1 my-3 pl-2 text-zinc-300"
          >
            {listItems}
          </ol>
        )
      } else {
        renderedElements.push(
          <ul
            key={`ul-${renderedElements.length}`}
            className="list-disc list-inside space-y-1 my-3 pl-2 text-zinc-300"
          >
            {listItems}
          </ul>
        )
      }
      inList = false
      listItems = []
    }
  }

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0]
      const body = tableRows.slice(1)
      renderedElements.push(
        <div key={`table-wrapper-${renderedElements.length}`} className="my-4 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-left text-xs divide-y divide-zinc-800">
            <thead className="bg-zinc-900/80 text-zinc-300 font-semibold">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-r border-zinc-800 last:border-r-0">
                    {renderInline(col.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40 text-zinc-300">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-zinc-900/40 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-r border-zinc-800/60 last:border-r-0">
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      inTable = false
      tableRows = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // コードブロックの開始/終了
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushList()
        flushTable()
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
        codeBlockLines = []
      } else {
        inCodeBlock = false
        const codeText = codeBlockLines.join('\n')
        renderedElements.push(
          <div
            key={`codeblock-${renderedElements.length}`}
            className="my-4 rounded-lg overflow-hidden border border-zinc-800 bg-[#0d1117]"
          >
            {codeBlockLang && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        )
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // テーブル行の判定
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList()
      // セパレータ行 (|---|---|) はスキップ
      if (/^\|[-:| ]+\|$/.test(line.trim())) {
        continue
      }
      const rawCols = line.trim().slice(1, -1).split('|')
      inTable = true
      tableRows.push(rawCols)
      continue
    } else if (inTable) {
      flushTable()
    }

    // リスト判定 (タスクリスト、通常のリスト)
    const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/)
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/)
    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)

    if (taskMatch) {
      if (inList && listIsOrdered) flushList()
      inList = true
      listIsOrdered = false
      const checked = taskMatch[2].toLowerCase() === 'x'
      const itemText = taskMatch[3]
      listItems.push(
        <li key={`task-${listItems.length}`} className="flex items-start gap-2 list-none -ml-4">
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mt-1 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-default"
          />
          <span className={checked ? 'line-through text-zinc-500' : 'text-zinc-300'}>
            {renderInline(itemText)}
          </span>
        </li>
      )
      continue
    } else if (bulletMatch) {
      if (inList && listIsOrdered) flushList()
      inList = true
      listIsOrdered = false
      listItems.push(
        <li key={`bullet-${listItems.length}`}>
          {renderInline(bulletMatch[2])}
        </li>
      )
      continue
    } else if (numberMatch) {
      if (inList && !listIsOrdered) flushList()
      inList = true
      listIsOrdered = true
      listItems.push(
        <li key={`num-${listItems.length}`}>
          {renderInline(numberMatch[2])}
        </li>
      )
      continue
    } else {
      flushList()
    }

    // 空行
    if (line.trim() === '') {
      continue
    }

    // 水平線
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      renderedElements.push(
        <hr key={`hr-${renderedElements.length}`} className="border-t border-zinc-800 my-6" />
      )
      continue
    }

    // 見出し
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const titleText = headingMatch[2]
      switch (level) {
        case 1:
          renderedElements.push(
            <h1
              key={`h1-${renderedElements.length}`}
              className="text-2xl font-bold text-zinc-100 pb-2 mb-4 mt-6 border-b border-zinc-800 flex items-center gap-2"
            >
              {renderInline(titleText)}
            </h1>
          )
          break
        case 2:
          renderedElements.push(
            <h2
              key={`h2-${renderedElements.length}`}
              className="text-xl font-semibold text-zinc-100 pb-1.5 mb-3 mt-5 border-b border-zinc-800/80"
            >
              {renderInline(titleText)}
            </h2>
          )
          break
        case 3:
          renderedElements.push(
            <h3 key={`h3-${renderedElements.length}`} className="text-lg font-medium text-zinc-200 mb-2 mt-4">
              {renderInline(titleText)}
            </h3>
          )
          break
        case 4:
          renderedElements.push(
            <h4 key={`h4-${renderedElements.length}`} className="text-base font-medium text-zinc-300 mb-2 mt-3">
              {renderInline(titleText)}
            </h4>
          )
          break
        default:
          renderedElements.push(
            <h5 key={`h5-${renderedElements.length}`} className="text-sm font-semibold text-zinc-400 mb-2 mt-2">
              {renderInline(titleText)}
            </h5>
          )
          break
      }
      continue
    }

    // 引用 (Blockquote)
    if (line.trim().startsWith('>')) {
      const quoteText = line.trim().replace(/^>\s*/, '')
      // GitHub Alert チェック [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
      const alertMatch = quoteText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i)
      if (alertMatch) {
        const type = alertMatch[1].toUpperCase()
        const alertLabel = type === 'NOTE' ? 'Note' : type === 'TIP' ? 'Tip' : type === 'WARNING' ? 'Warning' : type
        renderedElements.push(
          <div
            key={`alert-${renderedElements.length}`}
            className="my-3 p-3 rounded-lg border border-cyan-500/40 bg-cyan-950/20 text-cyan-200 text-xs flex flex-col gap-1"
          >
            <span className="font-semibold uppercase tracking-wider text-[11px] text-cyan-400 font-mono">
              {alertLabel}
            </span>
          </div>
        )
      } else {
        renderedElements.push(
          <blockquote
            key={`quote-${renderedElements.length}`}
            className="border-l-4 border-cyan-500/50 pl-3.5 py-1 my-3 text-zinc-400 text-sm bg-zinc-900/30 rounded-r"
          >
            {renderInline(quoteText)}
          </blockquote>
        )
      }
      continue
    }

    // 通常の段落
    renderedElements.push(
      <p key={`p-${renderedElements.length}`} className="text-sm text-zinc-300 leading-relaxed my-2">
        {renderInline(line)}
      </p>
    )
  }

  // 終了時の後処理
  flushList()
  flushTable()

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-[#0d1117] overflow-hidden shadow-2xl">
      {/* GitHub風ファイルヘッダー */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="font-mono font-medium text-zinc-200">{title}</span>
          <span className="text-[11px] text-zinc-500 font-mono ml-2">
            {lines.length} lines • {content.length} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition text-xs font-mono"
            title="Markdownソースをコピー"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* コンテンツ本体 */}
      <div className="p-6 md:p-8">
        <div className="prose prose-invert max-w-none">
          {renderedElements.length > 0 ? (
            renderedElements
          ) : (
            <p className="text-zinc-500 italic text-sm">(本文はありません)</p>
          )}
        </div>
      </div>
    </div>
  )
}
