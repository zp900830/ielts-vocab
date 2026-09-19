// 用 macOS 自带 Vision 做 OCR：扫描版 PDF 没有文字层时的唯一可用路径（机器上没有 tesseract 中文包以外的方案）。
// 用法：pdftoppm -r 170 -png book.pdf p && swiftc -O ocr_vision.swift -o ocr && ./ocr p-*.png > book.txt
import Foundation
import Vision
import AppKit

for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path),
        let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("!! unreadable \(path)"); continue
  }
  let req = VNRecognizeTextRequest { r, _ in
    let obs = (r.results as? [VNRecognizedTextObservation]) ?? []
    print("### PAGE \(path)")
    print(obs.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n"))
  }
  req.recognitionLevel = .accurate
  req.recognitionLanguages = ["zh-Hans", "en-US"]
  req.usesLanguageCorrection = true
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
}
