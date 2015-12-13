export class Base64Writer {
    bytesToBase64(type, buffer) {
        var binary = '';
        for (var i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
        }
        return type + btoa(binary);
    }
    ;
}
//# sourceMappingURL=Base64Writer.js.map