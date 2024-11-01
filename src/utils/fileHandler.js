const archiver = require("archiver");
const crypto = require("crypto");

const compactFile = async (fileBuffer, filename) => {
  try {
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    archive.append(fileBuffer, { name: filename });
    await archive.finalize();

    const archiveBuffer = await streamToBuffer(archive);
    const base64File = archiveBuffer.toString("base64");
    const md5 = crypto.createHash("md5").update(base64File).digest("hex");

    return { archiveBuffer, base64File, md5 };
  } catch (error) {
    console.log(error);
    throw new Error("Erro ao compactar arquivo");
  }
};

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

module.exports = { compactFile };
