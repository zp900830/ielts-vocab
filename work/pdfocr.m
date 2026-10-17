// 扫描版 PDF → 文本：CoreGraphics 渲染 + Vision OCR（机器上没有 poppler / tesseract）。
// 编译：clang -isysroot /Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk \
//        -framework Foundation -framework AppKit -framework PDFKit -framework Vision -o /tmp/pdfocr work/pdfocr.m
// 用法：pdfocr <pdf> <out.txt> <from> <to> [dpi]
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <PDFKit/PDFKit.h>
#import <Vision/Vision.h>

int main(int argc, const char **argv) { @autoreleasepool {
  if (argc < 5) { printf("usage: pdfocr <pdf> <out> <from> <to> [dpi]\n"); return 1; }
  PDFDocument *doc = [[PDFDocument alloc] initWithURL:[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]]];
  if (!doc) { printf("cannot open pdf\n"); return 1; }
  FILE *out = fopen(argv[2], "w");
  if (!out) { printf("cannot write out\n"); return 1; }
  int from = atoi(argv[3]), to = atoi(argv[4]);
  double dpi = argc > 5 ? atof(argv[5]) : 200.0;
  if (to > (int)[doc pageCount]) to = (int)[doc pageCount];
  for (int p = from; p <= to; p++) {
    @autoreleasepool {
      PDFPage *page = [doc pageAtIndex:p-1];
      if (!page) continue;
      CGRect r = [page boundsForBox:kPDFDisplayBoxMediaBox];
      double scale = dpi / 72.0;
      size_t w = (size_t)(r.size.width * scale), h = (size_t)(r.size.height * scale);
      CGContextRef ctx = CGBitmapContextCreate(NULL, w, h, 8, 0, CGColorSpaceCreateDeviceRGB(),
                                               kCGImageAlphaPremultipliedFirst);
      if (!ctx) continue;
      CGContextSetFillColorWithColor(ctx, CGColorCreateGenericRGB(1,1,1,1));
      CGContextFillRect(ctx, CGRectMake(0,0,w,h));
      CGContextScaleCTM(ctx, scale, scale);
      CGContextTranslateCTM(ctx, -r.origin.x, -r.origin.y);
      [page drawWithBox:kPDFDisplayBoxMediaBox toContext:ctx];
      CGImageRef img = CGBitmapContextCreateImage(ctx);
      CGContextRelease(ctx);
      if (!img) continue;
      VNRecognizeTextRequest *req = [[VNRecognizeTextRequest alloc] init];
      req.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
      req.recognitionLanguages = @[@"zh-Hans", @"en-US"];
      req.usesLanguageCorrection = YES;
      VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:img options:@{}];
      [handler performRequests:@[req] error:nil];
      CGImageRelease(img);
      fprintf(out, "### PAGE %d\n", p);
      NSArray *obs = req.results ?: @[];
      // 先按行自上而下、行内自左而右排（Vision 默认顺序不完全可靠）
      NSArray *sorted = [obs sortedArrayUsingComparator:^NSComparisonResult(VNRecognizedTextObservation *a, VNRecognizedTextObservation *b) {
        CGRect ra = a.boundingBox, rb = b.boundingBox;
        double ya = 1.0 - CGRectGetMidY(ra), yb = 1.0 - CGRectGetMidY(rb);
        if (fabs(ya - yb) > 0.008) return ya < yb ? NSOrderedAscending : NSOrderedDescending;
        return CGRectGetMinX(ra) < CGRectGetMinX(rb) ? NSOrderedAscending : NSOrderedDescending;
      }];
      for (VNRecognizedTextObservation *o in sorted) {
        NSString *s = [[o topCandidates:1] firstObject].string;
        if (s.length) fprintf(out, "%s\n", s.UTF8String);
      }
      fflush(out);
      if (p % 10 == 0) fprintf(stderr, "ocr page %d/%d\n", p, to);
    }
  }
  fclose(out);
  return 0; } }
