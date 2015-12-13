'use strict';

import {PngWriter} from './PngWriter';

/**
 * http://www.w3.org/TR/PNG-Filters.html
 * 6. Filter Algorithms
 *
 *  This chapter describes the filter algorithms that can be applied before compression. The purpose of these filters is to prepare the image data for optimum compression.
 *  6.1. Filter types
 *
 *  PNG filter method 0 defines five basic filter types:
 *  Type    Name
 *
 *  0       None
 *  1       Sub
 *  2       Up
 *  3       Average
 *  4       Paeth
 *  (Note that filter method 0 in IHDR specifies exactly this set of five filter types. If the set of filter types is ever extended, a different filter method number will be assigned to the extended set, so that decoders need not decompress the data to discover that it contains unsupported filter types.)
 *  The encoder can choose which of these filter algorithms to apply on a scanline-by-scanline basis. In the image data sent to the compression step, each scanline is preceded by a filter type byte that specifies the filter algorithm used for that scanline.
 *
 *  Filtering algorithms are applied to bytes, not to pixels, regardless of the bit depth or color type of the image. The filtering algorithms work on the byte sequence formed by a scanline that has been represented as described in Image layout. If the image includes an alpha channel, the alpha data is filtered in the same way as the image data.
 *
 *  When the image is interlaced, each pass of the interlace pattern is treated as an independent image for filtering purposes. The filters work on the byte sequences formed by the pixels actually transmitted during a pass, and the "previous scanline" is the one previously transmitted in the same pass, not the one adjacent in the complete image. Note that the subimage transmitted in any one pass is always rectangular, but is of smaller width and/or height than the complete image. Filtering is not applied when this subimage is empty.
 *
 *  For all filters, the bytes "to the left of" the first pixel in a scanline must be treated as being zero. For filters that refer to the prior scanline, the entire prior scanline must be treated as being zeroes for the first scanline of an image (or of a pass of an interlaced image).
 *
 *  To reverse the effect of a filter, the decoder must use the decoded values of the prior pixel on the same line, the pixel immediately above the current pixel on the prior line, and the pixel just to the left of the pixel above. This implies that at least one scanline's worth of image data will have to be stored by the decoder at all times. Even though some filter types do not refer to the prior scanline, the decoder will always need to store each scanline as it is decoded, since the next scanline might use a filter that refers to it.
 *
 *  PNG imposes no restriction on which filter types can be applied to an image. However, the filters are not equally effective on all types of data. See Recommendations for Encoders: Filter selection.
 *
 *  See also Rationale: Filtering.
 *
 *  6.2. Filter type 0: None
 *
 *  With the None filter, the scanline is transmitted unmodified; it is only necessary to insert a filter type byte before the data.
 *  6.3. Filter type 1: Sub
 *
 *  The Sub filter transmits the difference between each byte and the value of the corresponding byte of the prior pixel.
 *  To compute the Sub filter, apply the following formula to each byte of the scanline:
 *
 *  Sub(x) = Raw(x) - Raw(x-bpp)
 *  where x ranges from zero to the number of bytes representing the scanline minus one, Raw(x) refers to the raw data byte at that byte position in the scanline, and bpp is defined as the number of bytes per complete pixel, rounding up to one. For example, for color type 2 with a bit depth of 16, bpp is equal to 6 (three samples, two bytes per sample); for color type 0 with a bit depth of 2, bpp is equal to 1 (rounding up); for color type 4 with a bit depth of 16, bpp is equal to 4 (two-byte grayscale sample, plus two-byte alpha sample).
 *  Note this computation is done for each byte, regardless of bit depth. In a 16-bit image, each MSB is predicted from the preceding MSB and each LSB from the preceding LSB, because of the way that bpp is defined.
 *
 *  Unsigned arithmetic modulo 256 is used, so that both the inputs and outputs fit into bytes. The sequence of Sub values is transmitted as the filtered scanline.
 *
 *  For all x < 0, assume Raw(x) = 0.
 *
 *  To reverse the effect of the Sub filter after decompression, output the following value:
 *
 *  Sub(x) + Raw(x-bpp)
 *  (computed mod 256), where Raw refers to the bytes already decoded.
 *  6.4. Filter type 2: Up
 *
 *  The Up filter is just like the Sub filter except that the pixel immediately above the current pixel, rather than just to its left, is used as the predictor.
 *  To compute the Up filter, apply the following formula to each byte of the scanline:
 *
 *  Up(x) = Raw(x) - Prior(x)
 *  where x ranges from zero to the number of bytes representing the scanline minus one, Raw(x) refers to the raw data byte at that byte position in the scanline, and Prior(x) refers to the unfiltered bytes of the prior scanline.
 *  Note this is done for each byte, regardless of bit depth. Unsigned arithmetic modulo 256 is used, so that both the inputs and outputs fit into bytes. The sequence of Up values is transmitted as the filtered scanline.
 *
 *  On the first scanline of an image (or of a pass of an interlaced image), assume Prior(x) = 0 for all x.
 *
 *  To reverse the effect of the Up filter after decompression, output the following value:
 *
 *  Up(x) + Prior(x)
 *  (computed mod 256), where Prior refers to the decoded bytes of the prior scanline.
 *  6.5. Filter type 3: Average
 *
 *  The Average filter uses the average of the two neighboring pixels (left and above) to predict the value of a pixel.
 *  To compute the Average filter, apply the following formula to each byte of the scanline:
 *
 *  Average(x) = Raw(x) - floor((Raw(x-bpp)+Prior(x))/2)
 *  where x ranges from zero to the number of bytes representing the scanline minus one, Raw(x) refers to the raw data byte at that byte position in the scanline, Prior(x) refers to the unfiltered bytes of the prior scanline, and bpp is defined as for the Sub filter.
 *  Note this is done for each byte, regardless of bit depth. The sequence of Average values is transmitted as the filtered scanline.
 *
 *  The subtraction of the predicted value from the raw byte must be done modulo 256, so that both the inputs and outputs fit into bytes. However, the sum Raw(x-bpp)+Prior(x) must be formed without overflow (using at least nine-bit arithmetic). floor() indicates that the result of the division is rounded to the next lower integer if fractional; in other words, it is an integer division or right shift operation.
 *
 *  For all x < 0, assume Raw(x) = 0. On the first scanline of an image (or of a pass of an interlaced image), assume Prior(x) = 0 for all x.
 *
 *  To reverse the effect of the Average filter after decompression, output the following value:
 *
 *  Average(x) + floor((Raw(x-bpp)+Prior(x))/2)
 *  where the result is computed mod 256, but the prediction is calculated in the same way as for encoding. Raw refers to the bytes already decoded, and Prior refers to the decoded bytes of the prior scanline.
 *  6.6. Filter type 4: Paeth
 *
 *  The Paeth filter computes a simple linear function of the three neighboring pixels (left, above, upper left), then chooses as predictor the neighboring pixel closest to the computed value. This technique is due to Alan W. Paeth [PAETH].
 *  To compute the Paeth filter, apply the following formula to each byte of the scanline:
 *
 *  Paeth(x) = Raw(x) - PaethPredictor(Raw(x-bpp), Prior(x),
 *  Prior(x-bpp))
 *  where x ranges from zero to the number of bytes representing the scanline minus one, Raw(x) refers to the raw data byte at that byte position in the scanline, Prior(x) refers to the unfiltered bytes of the prior scanline, and bpp is defined as for the Sub filter.
 *  Note this is done for each byte, regardless of bit depth. Unsigned arithmetic modulo 256 is used, so that both the inputs and outputs fit into bytes. The sequence of Paeth values is transmitted as the filtered scanline.
 *
 *  The PaethPredictor function is defined by the following pseudocode:
 *
 *  function PaethPredictor (a, b, c)
 *  begin
 *      ; a = left, b = above, c = upper left
 *      p := a + b - c        ; initial estimate
 *      pa := abs(p - a)      ; distances to a, b, c
 *      pb := abs(p - b)
 *      pc := abs(p - c)
 *      ; return nearest of a,b,c,
 *      ; breaking ties in order a,b,c.
 *      if pa <= pb AND pa <= pc then return a
 *      else if pb <= pc then return b
 *      else return c
 *  end
 *  The calculations within the PaethPredictor function must be performed exactly, without overflow. Arithmetic modulo 256 is to be used only for the final step of subtracting the function result from the target byte value.
 *  Note that the order in which ties are broken is critical and must not be altered. The tie break order is: pixel to the left, pixel above, pixel to the upper left. (This order differs from that given in Paeth's article.)
 *
 *  For all x < 0, assume Raw(x) = 0 and Prior(x) = 0. On the first scanline of an image (or of a pass of an interlaced image), assume Prior(x) = 0 for all x.
 *
 *  To reverse the effect of the Paeth filter after decompression, output the following value:
 *
 *  Paeth(x) + PaethPredictor(Raw(x-bpp), Prior(x), Prior(x-bpp))
 *  (computed mod 256), where Raw and Prior refer to bytes already decoded. Exactly the same PaethPredictor function is used by both encoder and decoder.
 */
function paethPredictor(left: number, above: number, uppperLeft: number): number {
    var paeth = left + above - uppperLeft;
    var pLeft = Math.abs(paeth - left);
    var pAbove = Math.abs(paeth - above);
    var pUpLeft = Math.abs(paeth - uppperLeft);
    if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
    }
    if (pAbove <= pUpLeft) {
        return above;
    }
    return uppperLeft;
}

function filterNone(fromData: Uint8Array, fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number) {
    PngWriter.copy(fromData, filteredData, filteredPos, byteWidth, fromPos); // just copy the data without filtering
}

function filterSumNone(fromData: Uint8Array, fromPos: number, byteWidth: number) {
    var sum = 0;
    var length = fromPos + byteWidth;
    for (var i = fromPos; i < length; i++) {
        sum += Math.abs(fromData[i]);
    }
    return sum;
}

function filterSub(fromData: Uint8Array, fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number, bpp: number) {
    for (var i = 0; i < byteWidth; i++) {
        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        filteredData[filteredPos + i] = fromData[fromPos + i] - left;
    }
}

function filterSumSub(fromData: Uint8Array, fromPos: number, byteWidth: number, bpp: number) {
    var sum = 0;
    for (var i = 0; i < byteWidth; i++) {
        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        var val = fromData[fromPos + i] - left;

        sum += Math.abs(val);
    }
    return sum;
}

function filterUp(fromData: Uint8Array, fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number) {
    for (var i = 0; i < byteWidth; i++) {
        var up = fromPos > 0 ? fromData[fromPos + i - byteWidth] : 0;
        filteredData[filteredPos + i] = fromData[fromPos + i] - up;
    }
}

function filterSumUp(fromData: Uint8Array, fromPos: number, byteWidth: number) {
    var sum = 0;
    var length = fromPos + byteWidth;
    for (var i = fromPos; i < length; i++) {
        var up = fromPos > 0 ? fromData[i - byteWidth] : 0;
        var val = fromData[i] - up;

        sum += Math.abs(val);
    }
    return sum;
}

function filterAvg(fromData: Uint8Array, fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number, bpp: number) {
    for (var i = 0; i < byteWidth; i++) {

        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        var up = fromPos > 0 ? fromData[fromPos + i - byteWidth] : 0;
        filteredData[filteredPos + i] = fromData[fromPos + i] - ((left + up) >> 1);
    }
}

function filterSumAvg(fromData: Uint8Array, fromPos: number, byteWidth: number, bpp: number) {
    var sum = 0;
    for (var i = 0; i < byteWidth; i++) {
        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        var up = fromPos > 0 ? fromData[fromPos + i - byteWidth] : 0;
        var val = fromData[fromPos + i] - ((left + up) >> 1);

        sum += Math.abs(val);
    }
    return sum;
}

function filterPaeth(fromData: Uint8Array, fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number, bpp: number) {

    for (var i = 0; i < byteWidth; i++) {

        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        var up = fromPos > 0 ? fromData[fromPos + i - byteWidth] : 0;
        var upleft = fromPos > 0 && i >= bpp ? fromData[fromPos + i - (byteWidth + bpp)] : 0;
        filteredData[filteredPos + i] = fromData[fromPos + i] - paethPredictor(left, up, upleft);
    }
}

function filterSumPaeth(fromData: Uint8Array, fromPos: number, byteWidth: number, bpp: number) {
    var sum = 0;
    for (var i = 0; i < byteWidth; i++) {
        var left = i >= bpp ? fromData[fromPos + i - bpp] : 0;
        var up = fromPos > 0 ? fromData[fromPos + i - byteWidth] : 0;
        var upleft = fromPos > 0 && i >= bpp ? fromData[fromPos + i - (byteWidth + bpp)] : 0;
        var val = fromData[fromPos + i] - paethPredictor(left, up, upleft);

        sum += Math.abs(val);
    }
    return sum;
}

var FILTER_TYPES: {
    filter: (fromData: Uint8Array | number[], fromPos: number, byteWidth: number, filteredData: Uint8Array, filteredPos: number, bpp?: number) => void,
    sum: (fromData: Uint8Array | number[], fromPos: number, byteWidth: number, bpp?: number) => number,
    type: number
}[] = [
        {
            filter: filterNone,
            sum: filterSumNone,
            type: 0
        }, {
            filter: filterSub,
            sum: filterSumSub,
            type: 1
        }, {
            filter: filterUp,
            sum: filterSumUp,
            type: 2
        }, {
            filter: filterAvg,
            sum: filterSumAvg,
            type: 3
        }, {
            filter: filterPaeth,
            sum: filterSumPaeth,
            type: 4
        }
    ];

export function filter(imageData: ImageData): Uint8Array {
    const {width, height, data} = imageData;
    const bpp = 4; //bits per pixel r,g,b,a
    const byteWidth = width * bpp; //r,g,b,a
    var filtered = new Uint8Array((byteWidth + 1) * height);
    var filterTypePos = 0;
    var fromPos = 0;
    var filterType = 1;//starting from 1 to skip no filter
    for (var i = 0; i < height; i++) {

        var filterSumMin = Infinity;
        for (var j = 1; j < FILTER_TYPES.length; j++) {// starting from 1 to skip no filter
            var sum = FILTER_TYPES[j].sum(data, fromPos, byteWidth, bpp);
            if (sum < filterSumMin) {
                filterSumMin = sum;
                filterType = j;
            }
        }
        var filter = FILTER_TYPES[filterType];
        filtered[filterTypePos] = filter.type;//we need to write one additional byte with filter value each in row at the beginning
        filter.filter(data, fromPos, byteWidth, filtered, filterTypePos + 1, bpp);
        filterTypePos += (byteWidth + 1);
        fromPos += byteWidth;
    }
    return filtered;
}
