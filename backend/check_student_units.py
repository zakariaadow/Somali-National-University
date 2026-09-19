import sqlite3

def get_student_units(student_id):
    conn = sqlite3.connect('instance/snu.db')
    cursor = conn.cursor()
    
    # Get student's programme and year
    cursor.execute("""
        SELECT s.id, s.year_of_study, p.id, p.name 
        FROM students s 
        JOIN programmes p ON s.programme_id = p.id 
        WHERE s.id = ?
    """, (student_id,))
    student = cursor.fetchone()
    
    if not student:
        print("Student not found")
        return
    
    student_id, year, programme_id, programme_name = student
    
    print(f"Student: {student_id}, Programme: {programme_name}, Year: {year}")
    print("\n" + "="*60)
    
    # Get available units for this student's programme
    # Units are based on the department and semester
    cursor.execute("""
        SELECT u.id, u.code, u.name, u.credits, s.name as Semester, 
               f.name as Faculty, d.name as Department
        FROM units u
        JOIN departments d ON u.department_id = d.id
        JOIN faculties f ON d.faculty_id = f.id
        JOIN semesters s ON u.semester_id = s.id
        JOIN programmes p ON p.department_id = d.id
        WHERE p.id = ?
        ORDER BY s.semester_number, u.code
    """, (programme_id,))
    
    units = cursor.fetchall()
    
    if units:
        print("\n📚 AVAILABLE UNITS FOR YOUR PROGRAMME:\n")
        current_semester = None
        for unit in units:
            if unit[4] != current_semester:
                current_semester = unit[4]
                print(f"\n--- {current_semester} ---")
            print(f"  {unit[1]} - {unit[2]} ({unit[3]} credits) - {unit[6]}")
    else:
        print("No units available for this programme")
    
    # Check registered units
    cursor.execute("""
        SELECT u.code, u.name, su.is_registered, su.is_dropped
        FROM student_units su
        JOIN units u ON su.unit_id = u.id
        WHERE su.student_id = ?
    """, (student_id,))
    
    registered = cursor.fetchall()
    
    if registered:
        print("\n\n📋 YOUR REGISTERED UNITS:")
        for reg in registered:
            status = "✅ Active" if reg[2] == 1 and reg[3] == 0 else "❌ Dropped"
            print(f"  {reg[0]} - {reg[1]} ({status})")
    else:
        print("\n\n⚠️ You have not registered for any units yet.")
    
    conn.close()

# Check for student ID 1
get_student_units(1)
