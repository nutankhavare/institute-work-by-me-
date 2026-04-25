import { HttpRequest } from "@azure/functions";
import busboy from "busboy";

export interface MultipartResult {
  fields: Record<string, string>;
  files: Record<string, {
    buffer: Buffer;
    mimetype: string;
    filename: string;
    size: number;
  }>;
}

export async function parseMultipart(req: HttpRequest): Promise<MultipartResult> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return reject(new Error("Content-Type must be multipart/form-data"));
    }

    const bb = busboy({ 
      headers: { 
        "content-type": contentType 
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      }
    });

    const result: MultipartResult = {
      fields: {},
      files: {}
    };

    bb.on("file", (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks: Buffer[] = [];
      let size = 0;

      file.on("data", (data) => {
        chunks.push(data);
        size += data.length;
      });

      file.on("end", () => {
        result.files[name] = {
          buffer: Buffer.concat(chunks),
          mimetype: mimeType,
          filename,
          size
        };
      });
      
      file.on("limit", () => {
        reject(new Error(`File ${filename} exceeds 10MB limit`));
      });
    });

    bb.on("field", (name, val) => {
      result.fields[name] = val;
    });

    bb.on("finish", () => {
      resolve(result);
    });

    bb.on("error", (err) => {
      reject(err);
    });

    // Azure Functions v4 HttpRequest body is a ReadableStream.
    // We need to pipe it to busboy.
    if (req.body) {
       const nodeStream = require('stream').Readable.fromWeb(req.body as any);
       nodeStream.pipe(bb);
    } else {
       bb.end();
    }
  });
}
