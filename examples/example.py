import mysql.connector

def process_patient_data(patient_data):
    # Calculate the patient's BMI (Body Mass Index)
    bmi = round(patient_data['weight'] / ((patient_data['height'] / 100) ** 2), 2)

    # Determine the patient's weight status based on their BMI
    if bmi < 18.5:
        weight_status = 'Underweight'
    elif bmi < 25:
        weight_status = 'Normal weight'
    elif bmi < 30:
        weight_status = 'Overweight'
    else:
        weight_status = 'Obese'

    # Create a new dictionary with the processed patient data
    processed_patient_data = {
        'name': patient_data['name'],
        'age': patient_data['age'],
        'height': patient_data['height'],
        'weight': patient_data['weight'],
        'bmi': bmi,
        'weight_status': weight_status
    }

    # Connect to MySQL database
    connection = mysql.connector.connect(
        host='localhost',
        user='username',
        password='password',
        database='database_name'
    )

    if connection.is_connected():
        print('Connected to MySQL database.')

    # Insert the processed patient data into the MySQL database
    cursor = connection.cursor()
    query = "INSERT INTO patient_data (name, age, height, weight, bmi, weight_status) VALUES (%s, %s, %s, %s, %s, %s)"
    values = (processed_patient_data['name'], processed_patient_data['age'], processed_patient_data['height'], processed_patient_data['weight'], processed_patient_data['bmi'], processed_patient_data['weight_status'])
    cursor.execute(query, values)
    connection.commit()
    print(cursor.rowcount, "record inserted.")

    # Close the MySQL database connection
    cursor.close()
    connection.close()
    print('Disconnected from MySQL database.')

    # Return the processed patient data
    return processed_patient_data