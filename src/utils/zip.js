const AdmZip = require("adm-zip");
const mime = require("mime-types");

exports.listZipContentsFromBuffer = (zipBuffer) => {
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    const files = zipEntries.filter((entry) => !entry.isDirectory);

    return files.map((entry) => {
      const fileName = entry.entryName;
      const extension = fileName.split(".").pop().toLowerCase();
      const mimeType = mime.lookup(extension) || "application/octet-stream";

      return {
        nome: fileName,
        originalname: fileName,
        size: entry.header.size,
        mimetype: mimeType,
        modified: new Date(entry.header.time),
        buffer: entry.getData(),
      };
    });
  } catch (error) {
    throw new Error(`Erro ao ler ZIP: ${error.message}`);
  }
};
