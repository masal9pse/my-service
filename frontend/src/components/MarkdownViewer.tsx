import { useState, type ReactNode } from 'react'
import { Copy, Check, Code2, Eye } from 'lucide-react'

interface MarkdownViewerProps {
  content: string
  showToolbar?: boolean
}

// インラインマークダウンのパース（太字, 斜体, コード, リンク, 打消し）
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-[#16181c] text-[#1d9bf0] font-mono text-[0.88em] border border-[#2f3336]"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={`b-${match.index}`} className="font-bold text-[#e7e9ea]">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={`i-${match.index}`} className="italic text-[#e7e9ea]">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      nodes.push(
        <del key={`del-${match.index}`} className="line-through text-[#71767b]">
          {token.slice(2, -2)}
        </del>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const closingBracket = token.indexOf('](')
      const linkText = token.slice(1, closingBracket)
      const linkUrl = token.slice(closingBracket + 2, -1)
      nodes.push(
        <a
          key={`a-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1d9bf0] hover:underline transition"
          onClick={(e) => e.stopPropagation()}
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

export function MarkdownViewer({ content, showToolbar = true }: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview')

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
            className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-[#e7e9ea]"
          >
            {listItems}
          </ol>
        )
      } else {
        renderedElements.push(
          <ul
            key={`ul-${renderedElements.length}`}
            className="list-disc list-inside space-y-1.5 my-3 pl-2 text-[#e7e9ea]"
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
        <div key={`table-wrapper-${renderedElements.length}`} className="my-4 overflow-x-auto rounded-xl border border-[#2f3336]">
          <table className="min-w-full text-left text-xs divide-y divide-[#2f3336]">
            <thead className="bg-[#16181c] text-[#e7e9ea] font-semibold">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3.5 py-2.5 border-r border-[#2f3336] last:border-r-0">
                    {renderInline(col.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f3336]/60 bg-black text-[#e7e9ea]">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.03] transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 border-r border-[#2f3336]/60 last:border-r-0">
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

    // コードブロック
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
            className="my-3 rounded-xl overflow-hidden border border-[#2f3336] bg-[#0d1117]"
          >
            {codeBlockLang && (
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-[#2f3336] text-[11px] text-[#71767b] font-mono">
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-4 text-xs font-mono text-[#e7e9ea] overflow-x-auto leading-relaxed">
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

    // テーブル
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList()
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

    // リスト
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
            className="mt-1 rounded border-[#2f3336] bg-[#16181c] text-[#1d9bf0] focus:ring-0 cursor-default"
          />
          <span className={checked ? 'line-through text-[#71767b]' : 'text-[#e7e9ea]'}>
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
        <hr key={`hr-${renderedElements.length}`} className="border-t border-[#2f3336] my-5" />
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
              className="text-xl font-bold text-white pb-1.5 mb-3 mt-4 border-b border-[#2f3336]"
            >
              {renderInline(titleText)}
            </h1>
          )
          break
        case 2:
          renderedElements.push(
            <h2
              key={`h2-${renderedElements.length}`}
              className="text-lg font-bold text-white pb-1 mb-2 mt-3 border-b border-[#2f3336]/60"
            >
              {renderInline(titleText)}
            </h2>
          )
          break
        case 3:
          renderedElements.push(
            <h3 key={`h3-${renderedElements.length}`} className="text-base font-semibold text-white mb-2 mt-3">
              {renderInline(titleText)}
            </h3>
          )
          break
        default:
          renderedElements.push(
            <h4 key={`h4-${renderedElements.length}`} className="text-sm font-semibold text-[#e7e9ea] mb-1.5 mt-2">
              {renderInline(titleText)}
            </h4>
          )
          break
      }
      continue
    }

    // 引用
    if (line.trim().startsWith('>')) {
      const quoteText = line.trim().replace(/^>\s*/, '')
      renderedElements.push(
        <blockquote
          key={`quote-${renderedElements.length}`}
          className="border-l-4 border-[#1d9bf0] pl-3 py-1 my-2 text-[#71767b] text-sm bg-[#16181c]/50 rounded-r"
        >
          {renderInline(quoteText)}
        </blockquote>
      )
      continue
    }

    // 通常の段落
    renderedElements.push(
      <p key={`p-${renderedElements.length}`} className="text-sm sm:text-base text-[#e7e9ea] leading-relaxed my-2">
        {renderInline(line)}
      </p>
    )
  }

  flushList()
  flushTable()

  return (
    <div className="w-full">
      {/* ツールバー */}
      {showToolbar && (
        <div className="flex items-center justify-end gap-2 mb-3 text-xs">
          <div className="flex items-center rounded-full bg-[#16181c] p-0.5 border border-[#2f3336]">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                viewMode === 'preview'
                  ? 'bg-[#1d9bf0] text-white shadow-sm'
                  : 'text-[#71767b] hover:text-[#e7e9ea]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                viewMode === 'raw'
                  ? 'bg-[#1d9bf0] text-white shadow-sm'
                  : 'text-[#71767b] hover:text-[#e7e9ea]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#2f3336] bg-[#16181c] hover:bg-[#202327] text-[#71767b] hover:text-white transition text-xs"
            title="Markdownをコピー"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ba7c]" />
                <span className="text-[#00ba7c]">コピー済</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>コピー</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* コンテンツ本体 */}
      {viewMode === 'preview' ? (
        <div className="text-[#e7e9ea] space-y-1">
          {renderedElements.length > 0 ? (
            renderedElements
          ) : (
            <p className="text-[#71767b] italic text-sm">(本文はありません)</p>
          )}
        </div>
      ) : (
        <pre className="p-4 rounded-xl bg-[#16181c] border border-[#2f3336] text-xs font-mono text-[#e7e9ea] overflow-x-auto whitespace-pre-wrap leading-relaxed">
          <code>{content}</code>
        </pre>
      )}
    </div>
  )
}
