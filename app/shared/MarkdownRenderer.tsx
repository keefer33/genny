import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { ActionIcon, Box, Image, Tooltip, useMantineColorScheme } from "@mantine/core";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";
import CodeMirror from "@uiw/react-codemirror";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { copyToClipboard } from "~/lib/utils";

// Language mapping for CodeMirror
const getLanguageExtension = (language: string) => {
  switch (language.toLowerCase()) {
    case "javascript":
    case "js":
    case "typescript":
    case "ts":
      return javascript();
    case "json":
      return json();
    case "python":
    case "py":
      return python();
    case "html":
      return html();
    case "css":
      return css();
    case "markdown":
    case "md":
      return markdown();
    default:
      return javascript(); // fallback
  }
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  useDivForParagraphs?: boolean;
}

export default function MarkdownRenderer({
  content,
  className,
  style,
  useDivForParagraphs = false,
}: MarkdownRendererProps) {
  const { colorScheme } = useMantineColorScheme();

  const imageStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: 360,
    borderRadius: "var(--mantine-radius-sm)",
    objectFit: "contain",
  };

  return (
    <Box className={className} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          img: ({ src, alt, ...props }) => (
            <Box component="img" src={src} alt={alt ?? "Generated"} style={imageStyle} {...props} />
          ),
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const [copied, setCopied] = useState(false);
            const [isHovered, setIsHovered] = useState(false);

            if (match) {
              // Code block with language
              const codeContent = String(children).replace(/\n$/, "");

              const handleCopy = async () => {
                const success = await copyToClipboard(codeContent);
                if (success) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              };

              return (
                <Box
                  style={{
                    margin: "1em 0",
                    position: "relative",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                  onMouseEnter={() => {
                    setIsHovered(true);
                    setCopied(false);
                  }}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Box
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      zIndex: 10,
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <Tooltip label={copied ? "Copied!" : "Copy code"}>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={copied ? "green" : "gray"}
                        onClick={handleCopy}
                        style={{
                          backgroundColor:
                            colorScheme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.8)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  </Box>
                  <Box style={{ maxWidth: "100%", overflow: "auto" }}>
                    <CodeMirror
                      value={codeContent}
                      extensions={[getLanguageExtension(language)]}
                      theme={colorScheme === "dark" ? oneDark : undefined}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: false,
                        highlightActiveLine: false,
                        foldGutter: false,
                        dropCursor: false,
                        allowMultipleSelections: false,
                        indentOnInput: false,
                        syntaxHighlighting: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: false,
                        rectangularSelection: false,
                        crosshairCursor: false,
                        highlightSelectionMatches: false,
                        closeBracketsKeymap: false,
                        searchKeymap: false,
                        foldKeymap: false,
                        completionKeymap: false,
                        lintKeymap: false,
                      }}
                      editable={false}
                      style={{
                        fontSize: "0.875rem",
                        borderRadius: "6px",
                        overflow: "auto",
                        maxWidth: "100%",
                      }}
                    />
                  </Box>
                </Box>
              );
            } else {
              // Inline code
              return (
                <code
                  style={{
                    backgroundColor: colorScheme === "dark" ? "#2d3748" : "#f7fafc",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.875em",
                    fontFamily: "monospace",
                    color: colorScheme === "dark" ? "#e2e8f0" : "#2d3748",
                    wordBreak: "break-all",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
          },
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: `4px solid ${colorScheme === "dark" ? "#4a5568" : "#e2e8f0"}`,
                margin: "1em 0",
                padding: "0 1em",
                color: colorScheme === "dark" ? "#a0aec0" : "#4a5568",
                fontStyle: "italic",
                wordBreak: "break-word",
              }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div
              style={{
                overflowX: "auto",
                margin: "1em 0",
                maxWidth: "100%",
              }}
            >
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: "300px",
                  border: `1px solid ${colorScheme === "dark" ? "#4a5568" : "#e2e8f0"}`,
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: `1px solid ${colorScheme === "dark" ? "#4a5568" : "#e2e8f0"}`,
                padding: "8px 12px",
                backgroundColor: colorScheme === "dark" ? "#2d3748" : "#f7fafc",
                fontWeight: "bold",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                border: `1px solid ${colorScheme === "dark" ? "#4a5568" : "#e2e8f0"}`,
                padding: "8px 12px",
                wordBreak: "break-word",
              }}
            >
              {children}
            </td>
          ),
          p: ({ children }) => {
            // Check if children contain block-level elements (like divs) or images
            const hasBlockElements = React.Children.toArray(children).some((child) => {
              if (React.isValidElement(child)) {
                return (
                  child.type === "div" ||
                  child.type === "pre" ||
                  child.type === "blockquote" ||
                  child.type === "table" ||
                  child.type === "ul" ||
                  child.type === "ol" ||
                  child.type === "h1" ||
                  child.type === "h2" ||
                  child.type === "h3" ||
                  child.type === "h4" ||
                  child.type === "h5" ||
                  child.type === "h6" ||
                  child.type === "img" ||
                  child.type === Image
                );
              }
              return false;
            });

            // Use div instead of p if it contains block elements, images, or if useDivForParagraphs is true
            const Component = hasBlockElements || useDivForParagraphs ? "div" : "p";

            return (
              <Component
                style={{
                  margin: "0.5em 0",
                  wordBreak: "break-word",
                }}
              >
                {children}
              </Component>
            );
          },
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: "1.5em",
                margin: "1em 0 0.5em 0",
                wordBreak: "break-word",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: "1.3em",
                margin: "1em 0 0.5em 0",
                wordBreak: "break-word",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: "1.1em",
                margin: "1em 0 0.5em 0",
                wordBreak: "break-word",
              }}
            >
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                margin: "0.5em 0",
                paddingLeft: "1.5em",
                wordBreak: "break-word",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                margin: "0.5em 0",
                paddingLeft: "1.5em",
                wordBreak: "break-word",
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                margin: "0.25em 0",
                wordBreak: "break-word",
              }}
            >
              {children}
            </li>
          ),
          // HTML components
          div: ({ children, ...props }) => (
            <div
              style={{
                margin: "0.5em 0",
                wordBreak: "break-word",
              }}
              {...props}
            >
              {children}
            </div>
          ),
          span: ({ children, ...props }) => (
            <span
              style={{
                wordBreak: "break-word",
              }}
              {...props}
            >
              {children}
            </span>
          ),
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colorScheme === "dark" ? "#63b3ed" : "#3182ce",
                textDecoration: "underline",
                wordBreak: "break-word",
              }}
              {...props}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong
              style={{
                fontWeight: "bold",
                wordBreak: "break-word",
              }}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em
              style={{
                fontStyle: "italic",
                wordBreak: "break-word",
              }}
            >
              {children}
            </em>
          ),
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
