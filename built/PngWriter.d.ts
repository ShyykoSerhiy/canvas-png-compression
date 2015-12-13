/// <reference path="../typings/tsd.d.ts" />
export declare class PngWriter {
    static PNG_SIGNATURE: number[];
    static TYPE_IHDR: number;
    static TYPE_IEND: number;
    static TYPE_IDAT: number;
    write(imageData: ImageData, options?: PakoOptions): Uint8Array;
    /**
     * Creates IHDR chunk (image dimensions, color depth, compression method, etc.)
     * @param width of png image
     * @param height of png image
     */
    private writeIHDRChunk(width, height);
    /**
     * Creates IDAT chunk.
     */
    private writeIDATChunk(data);
    /**
     * Creates IEND chunk.
     */
    private writeIENDChunk();
    /**
     * Filters data with no filtering
     * @param width width of image
     * @param height height of image
     * @deprecated
     */
    private _filterData(imageData);
    private _writeChunk(type, data);
    private static _writeAsBigEndian(arr, value, startIndex);
    static copy(from: Uint8Array | number[], to: Uint8Array, toStartIndex: number, length?: number, fromStartPos?: number): void;
}
