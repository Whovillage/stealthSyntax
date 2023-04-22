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

    // Create a new object with the processed patient data
    const processedPatientData = {
        name: patientData.name,
        age: patientData.age,
        height: patientData.height,
        weight: patientData.weight,
        bmi: bmi,
        weightStatus: weightStatus
    };

    // Connect to MySQL database
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'database_name'
    });

    connection.connect(function(err) {
        if (err) throw err;
        console.log('Connected to MySQL database.');
    });

    // Insert the processed patient data into the MySQL database
    const query = `INSERT INTO patient_data (name, age, height, weight, bmi, weight_status) VALUES ('${processedPatientData.name}', ${processedPatientData.age}, ${processedPatientData.height}, ${processedPatientData.weight}, ${processedPatientData.bmi}, '${processedPatientData.weightStatus}')`;
    connection.query(query, function(error, results, fields) {
        if (error) throw error;
        console.log('Patient data successfully inserted into database.');
    });

    // Close the MySQL database connection
    connection.end(function(err) {
        if (err) throw err;
        console.log('Disconnected from MySQL database.');
    });

    // Return the processed patient data
    return processedPatientData;
}

state = {
    total: null,
    next: null,
    operation: null,
};