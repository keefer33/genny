import { useEffect, useState } from "react";
import { Img, OffthreadVideo, continueRender, delayRender } from "remotion";
import { loadGoogleFontFamily } from "../googleFontsCatalog";
import type { LayerContent } from "../layerContentTypes";

const fillStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const textContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 8,
  boxSizing: "border-box",
  overflow: "hidden",
};

type LayerContentRendererProps = {
  content: LayerContent | undefined;
};

export function LayerContentRenderer({ content }: LayerContentRendererProps) {
  if (!content) return null;

  if (content.type === "video") {
    if (!content.url.trim()) return null;
    return <OffthreadVideo src={content.url.trim()} style={fillStyle} muted />;
  }

  if (content.type === "image") {
    if (!content.url.trim()) return null;
    return <Img src={content.url.trim()} style={fillStyle} />;
  }

  return <LayerTextContent content={content} />;
}

function LayerTextContent({ content }: { content: Extract<LayerContent, { type: "text" }> }) {
  const [fontFamily, setFontFamily] = useState(content.fontFamily);

  useEffect(() => {
    const handle = delayRender(`load-layer-font-${content.fontImportName}`);
    void loadGoogleFontFamily(content.fontImportName)
      .then((loadedFamily) => {
        setFontFamily(loadedFamily);
        continueRender(handle);
      })
      .catch(() => {
        continueRender(handle);
      });
    return () => {
      continueRender(handle);
    };
  }, [content.fontImportName]);

  return (
    <div
      style={{
        ...textContainerStyle,
        fontFamily,
        fontSize: content.fontSize,
        color: content.color,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {content.text}
    </div>
  );
}
