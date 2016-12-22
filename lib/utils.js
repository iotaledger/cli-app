const collapseIotaAmount = (amount) => {
  if (!Number.isInteger(amount)) {
    return '';
  }

  /*
    1 Kiota = 10³ iota = 1,000 iota
    1 Miota = 10⁶ iota = 1,000,000 iota
    1 Giota = 10⁹ iota = 1,000,000,000 iota
    1 Tiota = 10¹² iota = 1,000,000,000,000 iota
    1 Piota = 10¹⁵ iota = 1,000,000,000,000,000 iota
    */
  const units = ['', 'K', 'M', 'G', 'T', 'P'];

  let amountString = amount + '';
  let unitIndex = 0;
  while (unitIndex < 6 && amountString.slice(-3) === '000') {
    unitIndex++;
    amountString = amountString.slice(0, -3);
  }
  return `${amountString}${units[unitIndex]}`;
};

module.exports = {
  collapseIotaAmount
};
