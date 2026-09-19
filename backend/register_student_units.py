import sqlite3
import sys

def register_units(student_id, unit_ids):
    conn = sqlite3.connect('instance/snu.db')
    cursor = conn.cursor()
    
    # Get current semester
    cursor.execute("SELECT id FROM semesters WHERE is_current = 1")
    semester = cursor.fetchone()
    
    if not semester:
        print("No current semester found")
        conn.close()
        return
    
    semester_id = semester[0]
    
    # Check if student already has a registration for this semester
    cursor.execute("""
        SELECT id FROM registrations 
        WHERE student_id = ? AND semester_id = ?
    """, (student_id, semester_id))
    
    registration = cursor.fetchone()
    
    if not registration:
        # Create registration
        cursor.execute("""
            INSERT INTO registrations (student_id, semester_id, status)
            VALUES (?, ?, 'pending')
        """, (student_id, semester_id))
        registration_id = cursor.lastrowid
        print(f"✅ Registration created (ID: {registration_id})")
    else:
        registration_id = registration[0]
        print(f"📋 Using existing registration (ID: {registration_id})")
    
    # Register each unit
    registered_count = 0
    for unit_id in unit_ids:
        # Check if already registered
        cursor.execute("""
            SELECT id FROM student_units 
            WHERE student_id = ? AND unit_id = ? AND registration_id = ?
        """, (student_id, unit_id, registration_id))
        
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO student_units (student_id, unit_id, registration_id, is_registered)
                VALUES (?, ?, ?, 1)
            """, (student_id, unit_id, registration_id))
            registered_count += 1
    
    conn.commit()
    print(f"✅ Registered {registered_count} new units")
    conn.close()

def list_available_units_for_student(student_id):
    conn = sqlite3.connect('instance/snu.db')
    cursor = conn.cursor()
    
    # Get student's programme
    cursor.execute("""
        SELECT programme_id FROM students WHERE id = ?
    """, (student_id,))
    
    result = cursor.fetchone()
    if not result:
        print("Student not found")
        conn.close()
        return
    
    programme_id = result[0]
    
    # Get available units
    cursor.execute("""
        SELECT u.id, u.code, u.name, u.credits, s.name as Semester
        FROM units u
        JOIN departments d ON u.department_id = d.id
        JOIN programmes p ON p.department_id = d.id
        JOIN semesters s ON u.semester_id = s.id
        WHERE p.id = ?
        ORDER BY s.semester_number, u.code
    """, (programme_id,))
    
    units = cursor.fetchall()
    
    print("\n📚 AVAILABLE UNITS TO REGISTER:\n")
    print("ID  Code    Name                              Credits  Semester")
    print("-"*60)
    for unit in units:
        print(f"{unit[0]:<3} {unit[1]:<7} {unit[2]:<30} {unit[3]:<8} {unit[4]}")
    
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        student_id = int(sys.argv[1])
        print(f"Showing available units for student ID: {student_id}\n")
        list_available_units_for_student(student_id)
        
        # Example: register specific units
        # To register, run: python3 register_student_units.py 1 1,2,3,4,5
        if len(sys.argv) > 2:
            unit_ids = [int(x.strip()) for x in sys.argv[2].split(',')]
            print(f"\nRegistering units: {unit_ids}")
            register_units(student_id, unit_ids)
    else:
        print("Usage: python3 register_student_units.py [student_id] [unit_ids]")
        print("Example: python3 register_student_units.py 1 1,2,3,4,5")
