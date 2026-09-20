export const formatDate = (date) => {

    return new Date(date).toLocaleDateString();

};

export const capitalize = (text) => {

    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);

};

export const generateDoctorId = () => {

    return "DOC" + Math.floor(1000 + Math.random() * 9000);

};

export const generateWorkerId = () => {

    return "WRK" + Math.floor(1000 + Math.random() * 9000);

};