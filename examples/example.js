const mysql = require('mysql');

function processPatientData(patientData) {
    // Calculate the patient's BMI (Body Mass Index)
    const bmi = (patientData.weight / Math.pow(patientData.height / 100, 2)).toFixed(2);

    // Determine the patient's weight status based on their BMI
    let weightStatus;
    if (bmi < 18.5) {
        weightStatus = 'Underweight';
    } else if (bmi < 25) {
        weightStatus = 'Normal weight';
    } else if (bmi < 30) {
        weightStatus = 'Overweight';
    } else {
        weightStatus = 'Obese';
    }
    
    patientData.weightStatus = weightStatus
    let processedPatientData = patientData

    
    // Return the processed patient data
    return processedPatientData;
}
