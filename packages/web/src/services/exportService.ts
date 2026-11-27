import JSZip from "jszip";
import type { Question } from "@ltvquiz/shared";

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateMarkdown = (
  title: string,
  questions: Question[],
  fallbackText?: string,
): string => {
  let md = `# ${title}\n\n`;

  if (questions.length === 0 && fallbackText) {
    const plain = fallbackText
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ");
    md += plain.trim() + "\n";
    return md;
  }

  questions.forEach((q, idx) => {
    const textPart = q.question.find((c) => c.type === "text")?.content || "";
    md += `### Câu ${idx + 1}: ${textPart}\n\n`;

    q.question.forEach((c) => {
      if (c.type === "image") {
        md += `![${c.alt || "image"}](${c.content})\n\n`;
      }
    });

    q.options.forEach((opt) => {
      const optText = opt.content.find((c) => c.type === "text")?.content || "";
      md += `- **${opt.label}.** ${optText}\n`;
    });

    md += "\n";
  });

  md += `## BẢNG ĐÁP ÁN\n\n`;
  questions.forEach((q, idx) => {
    if (q.type === "true_false_multiple") {
      const tfParts = q.options.map((opt) => {
        const isTrue = q.correctAnswer.includes(opt.id);
        return `${opt.label}: ${isTrue ? "Đ" : "S"}`;
      });
      md += `- **Câu ${idx + 1}:** ${tfParts.join(", ")}\n`;
    } else {
      const correctLabels = q.options
        .filter((opt) => q.correctAnswer.includes(opt.id))
        .map((opt) => opt.label);
      md += `- **Câu ${idx + 1}:** ${correctLabels.join(", ") || "Chưa có"}\n`;
    }
  });

  return md;
};

export const generateOfflineHtml = (
  title: string,
  questions: Question[],
  htmlContent?: string,
): string => {
  const questionsJson = JSON.stringify(questions);
  const safeTitle = escapeXml(title);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - Bản xem Ngoại tuyến</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --success-bg: #dcfce7;
      --success-text: #15803d;
      --success-border: #86efac;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --surface: #121214;
        --border: #27272a;
        --text: #f4f4f5;
        --text-muted: #a1a1aa;
        --primary: #3b82f6;
        --primary-hover: #60a5fa;
        --success-bg: #064e3b;
        --success-text: #a7f3d0;
        --success-border: #059669;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 1.5rem 1rem;
    }
    .container { max-width: 860px; margin: 0 auto; }
    .offline-banner {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    @media (prefers-color-scheme: dark) {
      .offline-banner { background: #1e3a8a33; color: #93c5fd; border-color: #1e40af; }
    }
    header {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    .meta { font-size: 0.875rem; color: var(--text-muted); }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }
    .q-title { font-weight: 700; font-size: 1.1rem; }
    .points {
      background: #eff6ff;
      color: var(--primary);
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .q-body { font-size: 1rem; margin-bottom: 1rem; white-space: pre-wrap; }
    .options { display: flex; flex-direction: column; gap: 0.6rem; }
    .opt-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--bg);
      cursor: pointer;
      transition: all 0.2s;
    }
    .opt-item:hover { border-color: var(--primary); }
    .opt-item.selected {
      border-color: var(--primary);
      background: #eff6ff44;
    }
    .opt-item.correct {
      border-color: var(--success-border);
      background: var(--success-bg);
      color: var(--success-text);
      font-weight: 600;
    }
    .btn-toggle-ans {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      margin-top: 1.5rem;
      display: inline-block;
    }
    .btn-toggle-ans:hover { background: var(--primary-hover); }
    .doc-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="offline-banner">
      <span>⚡</span>
      <span><strong>Chế độ ngoại tuyến (Offline)</strong> — Toàn bộ tài liệu và câu hỏi đã được đóng gói sẵn để xem và ôn tập mà không cần internet.</span>
    </div>

    <header>
      <h1>${safeTitle}</h1>
      <p class="meta">Tổng số: ${questions.length} câu hỏi • Có thể mở trực tiếp trên mọi thiết bị</p>
      <button class="btn-toggle-ans" onclick="toggleAnswers()">Hiện / Ẩn đáp án đúng</button>
    </header>

    ${htmlContent ? `<div class="doc-content"><h2>Nội dung văn bản gốc</h2><hr style="margin:1rem 0; border:0; border-top:1px solid var(--border);">${htmlContent}</div>` : ""}

    <div id="questions-list"></div>
  </div>

  <script>
    const questions = ${questionsJson};
    let showAnswers = false;

    function renderQuestions() {
      const container = document.getElementById('questions-list');
      container.innerHTML = questions.map((q, idx) => {
        const text = q.question.find(c => c.type === 'text')?.content || '';
        const optionsHtml = q.options.map(opt => {
          const optText = opt.content.find(c => c.type === 'text')?.content || '';
          const isCorrect = q.correctAnswer.includes(opt.id);
          const correctClass = showAnswers && isCorrect ? 'correct' : '';
          return \`
            <div class="opt-item \${correctClass}">
              <strong>\${opt.label}.</strong>
              <span>\${optText}</span>
              \${showAnswers && isCorrect ? '<span style="margin-left:auto; font-size:0.75rem;">✓ Đúng</span>' : ''}
            </div>
          \`;
        }).join('');

        return \`
          <div class="card">
            <div class="card-header">
              <span class="q-title">Câu \${idx + 1}</span>
              <span class="points">\${q.points} điểm</span>
            </div>
            <div class="q-body">\${text}</div>
            <div class="options">\${optionsHtml}</div>
          </div>
        \`;
      }).join('');
    }

    function toggleAnswers() {
      showAnswers = !showAnswers;
      renderQuestions();
    }

    renderQuestions();
  </script>
</body>
</html>`;
};

export const generateDocxBlob = async (
  title: string,
  questions: Question[],
  fallbackText?: string,
): Promise<Blob> => {
  const zip = new JSZip();

  interface DocxEmbeddedImage {
    rId: string;
    filename: string;
    ext: string;
    mime: string;
    base64: string;
    cx: number;
    cy: number;
  }

  const embeddedImages: DocxEmbeddedImage[] = [];
  const usedExtensions = new Set<string>();

  const registerDataImage = (dataUrl: string): DocxEmbeddedImage | null => {
    const match = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
      dataUrl.trim(),
    );
    if (!match) return null;
    const rawSubtype = match[1].toLowerCase();
    const ext = rawSubtype === "jpeg" ? "jpg" : rawSubtype;
    const mime = rawSubtype === "jpg" ? "image/jpeg" : `image/${rawSubtype}`;
    const idx = embeddedImages.length + 1;
    const rId = `rIdImg${idx}`;
    const filename = `image${idx}.${ext}`;
    usedExtensions.add(ext);
    const entry: DocxEmbeddedImage = {
      rId,
      filename,
      ext,
      mime,
      base64: match[2],
      // Default ~320px x 200px in Word EMUs (1px ≈ 9525 EMU)
      cx: 3048000,
      cy: 1905000,
    };
    embeddedImages.push(entry);
    zip.file(`word/media/${filename}`, match[2], { base64: true });
    return entry;
  };

  const buildImageRunXml = (img: DocxEmbeddedImage, docPrId: number): string => {
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${img.cx}" cy="${img.cy}"/><wp:docPr id="${docPrId}" name="${escapeXml(img.filename)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${escapeXml(img.filename)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${img.rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${img.cx}" cy="${img.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };

  let documentXmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>`;

  let docPrCounter = 1;

  if (questions.length === 0 && fallbackText) {
    const plain = fallbackText
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ");
    const paragraphs = plain.split("\n").filter((p) => p.trim().length > 0);
    paragraphs.forEach((p) => {
      documentXmlContent += `
    <w:p>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(p.trim())}</w:t></w:r>
    </w:p>`;
    });
  } else {
    questions.forEach((q, idx) => {
      const textPart = q.question
        .filter((c) => c.type !== "image")
        .map((c) => (c.type === "math" && !c.content.startsWith("$") ? `$${c.content}$` : c.content))
        .join(" ")
        .trim();
      documentXmlContent += `
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="26"/></w:rPr><w:t>Câu ${idx + 1}: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="26"/></w:rPr><w:t>${escapeXml(textPart)} (${q.points} điểm)</w:t></w:r>
    </w:p>`;

      q.question
        .filter((c) => c.type === "image")
        .forEach((imgBlock) => {
          const embedded = registerDataImage(imgBlock.content);
          if (embedded) {
            documentXmlContent += `
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr>${buildImageRunXml(embedded, docPrCounter++)}</w:p>`;
          }
        });

      q.options.forEach((opt) => {
        const optText = opt.content
          .filter((c) => c.type !== "image")
          .map((c) => (c.type === "math" && !c.content.startsWith("$") ? `$${c.content}$` : c.content))
          .join(" ")
          .trim();
        const isCorrect = q.correctAnswer.includes(opt.id);
        let optImgRuns = "";
        opt.content
          .filter((c) => c.type === "image")
          .forEach((imgBlock) => {
            const embedded = registerDataImage(imgBlock.content);
            if (embedded) {
              optImgRuns += buildImageRunXml(embedded, docPrCounter++);
            }
          });
        documentXmlContent += `
    <w:p>
      <w:pPr><w:ind w:left="360"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>${opt.label}. </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(optText)}</w:t></w:r>
      ${optImgRuns}
      ${
        isCorrect
          ? '<w:r><w:rPr><w:color w:val="2E7D32"/><w:i/><w:sz w:val="20"/></w:rPr><w:t>  [Đáp án đúng]</w:t></w:r>'
          : ""
      }
    </w:p>`;
      });

      documentXmlContent += `<w:p><w:r><w:t></w:t></w:r></w:p>`;
    });

    if (questions.length > 0) {
      documentXmlContent += `
    <w:p>
      <w:r><w:rPr><w:b/><w:sz w:val="30"/></w:rPr><w:t>BẢNG ĐÁP ÁN</w:t></w:r>
    </w:p>`;

      questions.forEach((q, idx) => {
        const correctLabels = q.options
          .filter((opt) => q.correctAnswer.includes(opt.id))
          .map((opt) => opt.label);
        documentXmlContent += `
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Câu ${idx + 1}: </w:t></w:r>
      <w:r><w:t>${escapeXml(correctLabels.join(", ") || "Chưa xác định")}</w:t></w:r>
    </w:p>`;
      });
    }
  }

  documentXmlContent += `
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>`;

  const extraContentTypes = Array.from(usedExtensions)
    .map((ext) => {
      const ct = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      return `\n  <Default Extension="${ext}" ContentType="${ct}"/>`;
    })
    .join("");

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>${extraContentTypes}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );

  if (embeddedImages.length > 0) {
    const docRels = embeddedImages
      .map(
        (img) =>
          `  <Relationship Id="${img.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${img.filename}"/>`,
      )
      .join("\n");
    zip.file(
      "word/_rels/document.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${docRels}
</Relationships>`,
    );
  }

  zip.file("word/document.xml", documentXmlContent);

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const generatePptxBlob = async (
  title: string,
  questions: Question[],
): Promise<Blob> => {
  const zip = new JSZip();

  // 1. Content Types
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;

  questions.forEach((_, idx) => {
    contentTypesXml += `
  <Override PartName="/ppt/slides/slide${idx + 2}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  });

  contentTypesXml += `
</Types>`;
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. Root Relationships
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
  );

  // 3. Presentation Relationships
  let presRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>`;

  questions.forEach((_, idx) => {
    presRelsXml += `
  <Relationship Id="rId${idx + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 2}.xml"/>`;
  });

  presRelsXml += `
</Relationships>`;
  zip.file("ppt/_rels/presentation.xml.rels", presRelsXml);

  // 4. Presentation.xml
  let presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`;

  questions.forEach((_, idx) => {
    presentationXml += `
    <p:sldId id="${257 + idx}" r:id="rId${idx + 3}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`;
  });

  presentationXml += `
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
  zip.file("ppt/presentation.xml", presentationXml);

  // 5. Theme
  zip.file(
    "ppt/theme/theme1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="000000"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="2563EB"/></a:accent1>
      <a:accent2><a:srgbClr val="10B981"/></a:accent2>
      <a:accent3><a:srgbClr val="F59E0B"/></a:accent3>
      <a:accent4><a:srgbClr val="EF4444"/></a:accent4>
      <a:accent5><a:srgbClr val="6366F1"/></a:accent5>
      <a:accent6><a:srgbClr val="EC4899"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink>
      <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`,
  );

  // 6. Slide Layout & Master
  zip.file(
    "ppt/slideLayouts/slideLayout1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
    </p:spTree>
  </p:cSld>
</p:sldLayout>`,
  );
  zip.file(
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
  );

  zip.file(
    "ppt/slideMasters/slideMaster1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
    </p:spTree>
  </p:cSld>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
  </p:sldLayoutIdLst>
  <p:txStyles/>
</p:sldMaster>`,
  );
  zip.file(
    "ppt/slideMasters/_rels/slideMaster1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
  );

  // Common slide relationship to layout
  const slideRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

  // 7. Slide 1: Cover Slide
  const coverSlideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="914400" y="1524000"/><a:ext cx="7315200" cy="1828800"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr anchor="ctr"/>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r><a:rPr sz="4400" b="1"><a:solidFill><a:srgbClr val="1E40AF"/></a:solidFill></a:rPr><a:t>${escapeXml(title)}</a:t></a:r>
          </a:p>
          <a:p>
            <a:pPr algn="ctr"/>
            <a:r><a:rPr sz="2000"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t>Bộ câu hỏi trình chiếu (${questions.length} câu)</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
  zip.file("ppt/slides/slide1.xml", coverSlideXml);
  zip.file("ppt/slides/_rels/slide1.xml.rels", slideRelsXml);

  // 8. Questions Slides
  questions.forEach((q, idx) => {
    const textPart = q.question.find((c) => c.type === "text")?.content || "";
    const slideNumber = idx + 2;

    let optionsXml = "";
    q.options.forEach((opt, optIdx) => {
      const optText = opt.content.find((c) => c.type === "text")?.content || "";
      const isCorrect = q.correctAnswer.includes(opt.id);
      const colorVal = isCorrect ? "059669" : "334155";
      const optY = 2200000 + optIdx * 650000;

      optionsXml += `
      <p:sp>
        <p:nvSpPr><p:cNvPr id="${10 + optIdx}" name="Option ${opt.label}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="914400" y="${optY}"/><a:ext cx="7315200" cy="550000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 12000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="${isCorrect ? "DCFCE7" : "F8FAFC"}"/></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="${isCorrect ? "10B981" : "CBD5E1"}"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr anchor="ctr" lIns="182880"/>
          <a:p>
            <a:r><a:rPr sz="1800" b="1"><a:solidFill><a:srgbClr val="${colorVal}"/></a:solidFill></a:rPr><a:t>${opt.label}. </a:t></a:r>
            <a:r><a:rPr sz="1800"><a:solidFill><a:srgbClr val="${colorVal}"/></a:solidFill></a:rPr><a:t>${escapeXml(optText)}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>`;
    });

    const questionSlideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      
      <!-- Slide Header -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Question Header"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="914400" y="457200"/><a:ext cx="7315200" cy="600000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr anchor="top"/>
          <a:p>
            <a:r><a:rPr sz="2400" b="1"><a:solidFill><a:srgbClr val="2563EB"/></a:solidFill></a:rPr><a:t>Câu ${idx + 1} (${q.points} điểm)</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Question Text -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Question Body"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="914400" y="1057200"/><a:ext cx="7315200" cy="950000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr anchor="top"/>
          <a:p>
            <a:r><a:rPr sz="2000"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:rPr><a:t>${escapeXml(textPart)}</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Options -->
      ${optionsXml}

    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${slideNumber}.xml`, questionSlideXml);
    zip.file(`ppt/slides/_rels/slide${slideNumber}.xml.rels`, slideRelsXml);
  });

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
};

export const printExamPdf = (
  title: string,
  questions: Question[],
  htmlContent?: string,
): void => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const safeTitle = escapeXml(title);
  let questionsHtml = "";

  questions.forEach((q, idx) => {
    const textPart = q.question.find((c) => c.type === "text")?.content || "";
    let optionsHtml = "";
    q.options.forEach((opt) => {
      const optText = opt.content.find((c) => c.type === "text")?.content || "";
      optionsHtml += `<div class="opt-line"><strong>${opt.label}.</strong> ${escapeXml(optText)}</div>`;
    });

    questionsHtml += `
      <div class="q-block">
        <div class="q-head"><strong>Câu ${idx + 1}:</strong> ${escapeXml(textPart)} <em>(${q.points} điểm)</em></div>
        <div class="opt-grid">${optionsHtml}</div>
      </div>
    `;
  });

  let answerKeyTable = '<table class="ans-table"><tr><th>Câu</th>';
  questions.forEach((_, idx) => {
    answerKeyTable += `<td>${idx + 1}</td>`;
  });
  answerKeyTable += "</tr><tr><th>Đáp án</th>";
  questions.forEach((q) => {
    const correct = q.options
      .filter((o) => q.correctAnswer.includes(o.id))
      .map((o) => o.label)
      .join(", ");
    answerKeyTable += `<td>${escapeXml(correct || "-")}</td>`;
  });
  answerKeyTable += "</tr></table>";

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle} - In Đề thi / Xuất PDF</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; color: #000; padding: 20mm; }
    h1 { text-align: center; font-size: 16pt; margin-bottom: 5px; text-transform: uppercase; }
    .subhead { text-align: center; font-size: 11pt; margin-bottom: 25px; font-style: italic; }
    .q-block { margin-bottom: 14px; page-break-inside: avoid; }
    .q-head { font-size: 13pt; margin-bottom: 4px; }
    .opt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 15px; padding-left: 20px; }
    .opt-line { font-size: 12.5pt; }
    .ans-section { margin-top: 30px; page-break-before: auto; }
    .ans-table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: center; font-size: 11pt; }
    .ans-table th, .ans-table td { border: 1px solid #000; padding: 4px 6px; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <div class="subhead">Thời gian làm bài: 45 phút • Không kể thời gian phát đề</div>
  ${htmlContent ? `<div style="margin-bottom:20px;">${htmlContent}</div>` : ""}
  <div>${questionsHtml}</div>
  <div class="ans-section">
    <h3 style="text-align:center; text-transform:uppercase;">BẢNG ĐÁP ÁN</h3>
    ${answerKeyTable}
  </div>
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`);

  printWindow.document.close();
};
