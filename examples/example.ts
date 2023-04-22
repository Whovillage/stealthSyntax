import mysql, { Connection } from 'mysql';

interface PatientData {
    name: string;
    age: number;
    height: number;
    weight: number;
}

interface ProcessedPatientData extends PatientData {
    bmi: number;
    weightStatus: string;
}

function processPatientData(patientData: PatientData): ProcessedPatientData {
    // Calculate the patient's BMI (Body Mass Index)
    const bmi = (patientData.weight / Math.pow(patientData.height / 100, 2)).toFixed(2);

    // Determine the patient's weight status based on their BMI
    let weightStatus: string;
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
    const processedPatientData: ProcessedPatientData = {
        name: patientData.name,
        age: patientData.age,
        height: patientData.height,
        weight: patientData.weight,
        bmi: parseFloat(bmi),
        weightStatus: weightStatus
    };

    // Connect to MySQL database
    const connection: Connection = mysql.createConnection({
        host: 'localhost',
        user: 'username',
        password: 'password',
        database: 'database_name'
    });

    connection.connect((err) => {
        if (err) throw err;
        console.log('Connected to MySQL database.');
    });

    // Insert the processed patient data into the MySQL database
    const query = `INSERT INTO patient_data (name, age, height, weight, bmi, weight_status) VALUES ('${processedPatientData.name}', ${processedPatientData.age}, ${processedPatientData.height}, ${processedPatientData.weight}, ${processedPatientData.bmi}, '${processedPatientData.weightStatus}')`;
    connection.query(query, (error, results, fields) => {
        if (error) throw error;
        console.log('Patient data successfully inserted into database.');
    });

    // Close the MySQL database connection
    connection.end((err) => {
        if (err) throw err;
        console.log('Disconnected from MySQL database.');
    });

    // Return the processed patient data
    return processedPatientData;
}