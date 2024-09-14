const formatarDataOmie1 = (data) => {
  const [datePart] = data.split(" ");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year}`;
};

const formatarDataOmie2 = (dateStr) => {
  const date = new Date(dateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatarDataOmie = (data) => {
  // Verifica se o formato é "yyyy-MM-dd"
  if (/^\d{4}-\d{2}-\d{2}/.test(data)) {
    return formatarDataOmie1(data);
  } else {
    return formatarDataOmie2(data);
  }
};

module.exports = { formatarDataOmie };
