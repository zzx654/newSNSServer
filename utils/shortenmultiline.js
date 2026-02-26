function shortenMultiline(text) {
  const lines = text.split(/\r?\n/);

  if (lines.length === 1) {
    return text;
  }

  return lines[0] + '....';
}

module.exports = { shortenMultiline }