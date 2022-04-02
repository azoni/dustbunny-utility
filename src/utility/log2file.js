const fs = require('fs');

// Private function
function throwIfStreamMissing() {
  if (!this.stream) {
    throw new Error('You have not opened the file yet');
  }
}

// Class definiton

class FileLogger {
  constructor(filename) {
    if (typeof filename !== 'string' || filename === '') {
      throw new Error(`Invalid filename : "${filename}"`);
    }
    this.filename = filename;
  }

  open() {
    if (this.stream) {
      throw new Error('You need to close the file before reopening another stream.');
    }
    this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
  }

  close() {
    if (this.stream) {
      this.stream.close();
    }
    this.stream = undefined;
  }

  print(msg) {
    throwIfStreamMissing.call(this);
    try {
      this.stream.write(msg);
    } catch (error) {
      console.error(error);
      console.log('error writing to file');
    }
  }

  printLn(msg) {
    this.print(`${msg}\n`);
  }
}

module.exports = {
  FileLogger,
}
