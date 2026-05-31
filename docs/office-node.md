# 타루 — MS Office 문서 생성 (Node 라이브러리 방식)

> Python·공식 office 스킬을 쓰지 않는다. 아래 Node 라이브러리로 직접 파일을 만들어
> `send_file_to_discord` 로 보낸다. 4개 모두 설치·검증 완료 (루트 `package.json`).

| 형식  | 라이브러리   | 용도                       |
|-------|-------------|----------------------------|
| .pptx | `pptxgenjs` | 발표자료·제안서·슬라이드   |
| .docx | `docx`      | 보고서·편지·공지·이력서    |
| .xlsx | `exceljs`   | 표·계산·데이터 정리·차트   |
| .pdf  | `pdf-lib`   | PDF 생성·편집·양식         |

## 만드는 방법

1. `.cache/` 안에 `.mjs` 스크립트를 하나 작성한다 (아래 스니펫 참고, 이미 검증됨).
2. 결과 파일은 `~/Documents/Taru_Memory/inbox/` 또는 `.cache/` 같은 곳에 저장.
3. `node <스크립트>.mjs` 로 실행.
4. `send_file_to_discord` 에 **전체 경로**를 넘겨 전송. 짧은 설명은 `reply` 로 같이.

> 한글 폰트: pptxgenjs/docx/exceljs 는 시스템 폰트를 그대로 쓰므로 한글 OK.
> pdf-lib 의 표준폰트(Helvetica)는 한글 미지원 → PDF 에 한글 넣으려면 한글 TTF 를
> `fontkit` 으로 임베드하거나, docx/pptx 로 만든 뒤 PDF 변환을 고려.

## 검증된 스니펫

```js
// PPTX
import PptxGenJS from 'pptxgenjs'
const pptx = new PptxGenJS()
pptx.addSlide().addText('제목', { x: 1, y: 1, fontSize: 32, color: '2E74B5' })
await pptx.writeFile({ fileName: 'out.pptx' })

// DOCX
import { Document, Packer, Paragraph, TextRun } from 'docx'
import fs from 'node:fs'
const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun('본문')] })] }] })
fs.writeFileSync('out.docx', await Packer.toBuffer(doc))

// XLSX
import ExcelJS from 'exceljs'
const wb = new ExcelJS.Workbook()
const ws = wb.addWorksheet('시트1')
ws.addRow(['이름', '점수']); ws.addRow(['타루', 100])
await wb.xlsx.writeFile('out.xlsx')

// PDF
import { PDFDocument, StandardFonts } from 'pdf-lib'
const pdf = await PDFDocument.create()
const page = pdf.addPage([595, 842]) // A4
const font = await pdf.embedFont(StandardFonts.Helvetica)
page.drawText('Hello', { x: 50, y: 780, size: 18, font })
fs.writeFileSync('out.pdf', await pdf.save())
```

## 문서 읽기

받은 파일(.pdf/.docx/이미지)은 `Read` 도구로 직접 읽을 수 있다. 표/스프레드시트는
`exceljs` 로 로드해 파싱. 별도 markitdown(Python) 불필요.
