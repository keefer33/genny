import { useEffect, useState } from "react";
import { Img, OffthreadVideo, continueRender, delayRender } from "remotion";
import { AnimatedText } from "remotion-bits";
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

  if (content.type === "animatedText") {
    return <LayerAnimatedTextContent content={content} />;
  }

  return <LayerTextContent content={content} />;
}

function useLayerFontFamily(fontImportName: string, fallbackFamily: string, bold: boolean) {
  const [fontFamily, setFontFamily] = useState(fallbackFamily);

  useEffect(() => {
    const handle = delayRender(`load-layer-font-${fontImportName}-${bold ? "700" : "400"}`);
    void loadGoogleFontFamily(fontImportName, { bold })
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
  }, [fontImportName, bold]);

  return fontFamily;
}

function textFontWeight(bold: boolean): React.CSSProperties["fontWeight"] {
  return bold ? 700 : 400;
}

function LayerAnimatedTextContent({
  content,
}: {
  content: Extract<LayerContent, { type: "animatedText" }>;
}) {
  const fontFamily = useLayerFontFamily(content.fontImportName, content.fontFamily, content.bold);
  const { transition } = content;

  return (
    <div style={textContainerStyle}>
      <AnimatedText
        transition={{
          split: transition.split,
          duration: transition.duration,
          splitStagger: transition.stagger,
          opacity: transition.opacity,
          y: transition.y,
        }}
        style={{
          fontFamily,
          fontSize: content.fontSize,
          fontWeight: textFontWeight(content.bold),
          color: content.color,
          textAlign: "center",
          width: "100%",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content.text}
      </AnimatedText>
    </div>
  );
}

function LayerTextContent({ content }: { content: Extract<LayerContent, { type: "text" }> }) {
  const fontFamily = useLayerFontFamily(content.fontImportName, content.fontFamily, content.bold);

  return (
    <div
      style={{
        ...textContainerStyle,
        fontFamily,
        fontSize: content.fontSize,
        fontWeight: textFontWeight(content.bold),
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
