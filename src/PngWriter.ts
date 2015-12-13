/// <reference path="../typings/tsd.d.ts" />
import * as pako from 'pako';
import * as crc32 from 'pako/lib/zlib/crc32';
import {filter} from './Filter';

export class PngWriter {
    static PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    static TYPE_IHDR = 0x49484452;
    static TYPE_IEND = 0x49454e44;
    static TYPE_IDAT = 0x49444154;

    write(imageData: ImageData, options?: PakoOptions) {
        options = options || {};
        var parts: Uint8Array[] = [];
        parts.push(new Uint8Array(PngWriter.PNG_SIGNATURE));
        parts.push(this.writeIHDRChunk(imageData.width, imageData.height));
        var filtered = filter(imageData);//this._filterData(imageData);
        var compressed = pako.deflate(filtered, Object.assign({
            /**
             * //compression level 0-9
             * #define Z_NO_COMPRESSION         0
               #define Z_BEST_SPEED             1
               #define Z_BEST_COMPRESSION       9
             */
            level: 0,
            /**
             * The windowBits parameter is the base two logarithm of the window size (the size of the history buffer). It should be in the range 8..15 for this version of the library. Larger values of this parameter result in better compression at the expense of memory usage. The default value is 15 if deflateInit is used instead.
             windowBits can also be –8..–15 for raw deflate. In this case, -windowBits determines the window size. deflate() will then generate raw deflate data with no zlib header or trailer, and will not compute an adler32 check value.
             */
            windowBits: 15,
            /**
             * - chunk size used for deflating data chunks, this should be power of 2 and must not be less than 256 and more than 32*1024
             */
            chunkSize: 32 * 1024,
            /**
             * var Z_FILTERED            = 1;
               var Z_HUFFMAN_ONLY        = 2;
               var Z_RLE                 = 3;
               var Z_FIXED               = 4;
               var Z_DEFAULT_STRATEGY    = 0;
               The strategy parameter is used to tune the compression algorithm. Use the value Z_DEFAULT_STRATEGY for normal data, Z_FILTERED for data produced by a filter (or predictor), Z_HUFFMAN_ONLY to force Huffman encoding only (no string match), or Z_RLE to limit match distances to one (run-length encoding). Filtered data consists mostly of small values with a somewhat random distribution. In this case, the compression algorithm is tuned to compress them better. The effect of Z_FILTERED is to force more Huffman coding and less string matching; it is somewhat intermediate between Z_DEFAULT_STRATEGY and Z_HUFFMAN_ONLY. Z_RLE is designed to be almost as fast as Z_HUFFMAN_ONLY, but give better compression for PNG image data. The strategy parameter only affects the compression ratio but not the correctness of the compressed output even if it is not set appropriately. Z_FIXED prevents the use of dynamic Huffman codes, allowing for a simpler decoder for special applications.
             */
            strategy: 3
        }, options)) as Uint8Array;
        parts.push(this.writeIDATChunk(compressed));
        parts.push(this.writeIENDChunk());
        var bufferSize = parts.reduce((pr, cu) => {
            return cu.length + pr;
        }, 0);
        var offset = 0;
        return parts.reduce((pr, cu) => {
            pr.set(cu, offset);
            offset += cu.length;
            return pr;
        }, new Uint8Array(bufferSize));
    }

    /**
     * Creates IHDR chunk (image dimensions, color depth, compression method, etc.)
     * @param width of png image
     * @param height of png image
     */
    private writeIHDRChunk(width: number, height: number): Uint8Array {
        var ihdr = new Uint8Array(13);
        PngWriter._writeAsBigEndian(ihdr, width, 0);
        PngWriter._writeAsBigEndian(ihdr, height, 4);
        ihdr[8] = 8;  // Bit depth: 8 bits per sample //todo add this as option maybe (need to recalculate bpp for this)
        ihdr[9] = 6;  // Color type: 6 = RGBA // todo add this as option maybe (need to recalculate bpp for this)
        ihdr[10] = 0;  // Compression method: DEFLATE (pako comes handy)
        ihdr[11] = 0;  // Filter method: Adaptive
        ihdr[12] = 0;  // Interlace method: None

        return this._writeChunk(PngWriter.TYPE_IHDR, ihdr);
    }

    /**
     * Creates IDAT chunk.
     */
    private writeIDATChunk(data: Uint8Array): Uint8Array {
        return this._writeChunk(PngWriter.TYPE_IDAT, data);
    }

    /**
     * Creates IEND chunk.
     */
    private writeIENDChunk(): Uint8Array {
        return this._writeChunk(PngWriter.TYPE_IEND, null);
    }

    /**
     * Filters data with no filtering
     * @param width width of image
     * @param height height of image
     * @deprecated
     */
    private _filterData(imageData: ImageData) {
        //todo no filter for now        
        const filterType = 0;//no filter
        const {width, height, data} = imageData;
        const byteWidth = width * 4; //r,g,b,a
        var filtered = new Uint8Array((byteWidth + 1) * height);
        var filterTypePos = 0;
        var fromPos = 0;
        for (var i = 0; i < height; i++) {
            filtered[filterTypePos] = filterType; //we need to write one additional byte with filter value each in row at the beginning            
            PngWriter.copy(data, filtered, filterTypePos + 1, byteWidth, fromPos); // just copy the data without filtering
            filterTypePos += (byteWidth + 1);
            fromPos += byteWidth;
        }
        return filtered;
    }

    private _writeChunk(type: number, /*nullable*/data: Uint8Array) {
        var {length: len} = data !== null ? data : { length: 0 };
        var buf = new Uint8Array(len + 12);

        PngWriter._writeAsBigEndian(buf, len, 0);
        PngWriter._writeAsBigEndian(buf, type, 4);
        if (data !== null) {
            PngWriter.copy(data, buf, 8);
        }
        var partWithoutLen = buf.slice(4, buf.length - 4);

        PngWriter._writeAsBigEndian(buf, crc32.default(0, partWithoutLen, partWithoutLen.length, 0), buf.length - 4);
        return buf;
    };

    private static _writeAsBigEndian(arr: Uint8Array, value: number, startIndex: number) {
        arr[startIndex] = value >>> 24;
        arr[startIndex + 1] = value >>> 16;
        arr[startIndex + 2] = value >>> 8;
        arr[startIndex + 3] = value >>> 0;
    }

    public static copy(from: Uint8Array | number[], to: Uint8Array, toStartIndex: number, length?: number, fromStartPos?: number) {
        length = (typeof length === 'undefined' || length === null) ? from.length : length;
        fromStartPos = (typeof fromStartPos === 'undefined' || fromStartPos === null) ? 0 : fromStartPos;
        to.set((from as Uint8Array).subarray(fromStartPos, fromStartPos + length), toStartIndex);
    }
}