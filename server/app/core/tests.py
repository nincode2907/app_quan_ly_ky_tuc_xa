from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from .models import Area, Building, Room, Faculty, Student, Contract, CheckInOutLog, Bill, Violation
from django.core.exceptions import ValidationError

User = get_user_model()

# Create your tests here.
class DormitoryTestCase(TestCase):
    def setUp(self):
        self.area = Area.objects.create(name="Khu A")
        
        self.building_male = Building.objects.create(
            name="A1", area=self.area, gender="male"
        )
        self.building_female = Building.objects.create(
            name="A2", area=self.area, gender="female"
        )
        
        self.room_male = Room.objects.create(
            number="101", building=self.building_male, capacity=2, floor=1, available_slots=2
        )
        self.room_female = Room.objects.create(
            number="201", building=self.building_female, capacity=2, floor=2, available_slots=2
        )
        
        self.faculty = Faculty.objects.create(name="Information Technology", code="CNTT")
        
        self.student_male = Student.objects.create(
            full_name="Nguyen Van A",
            faculty=self.faculty,
            year_start=2023,
            gender="male",
            home_town="Hanoi",
            date_of_birth=timezone.datetime(2000, 1, 1).date(),
            student_id="SV001"
        )
        self.student_female = Student.objects.create(
            full_name="Tran Thi B",
            faculty=self.faculty,
            year_start=2023,
            gender="female",
            home_town="HCMC",
            date_of_birth=timezone.datetime(2000, 1, 1).date(),
            student_id="SV002"
        )
        
        self.user_male = User.objects.create_user(
            email="sv001@example.com", password="password", student=self.student_male
        )
        self.user_female = User.objects.create_user(
            email="sv002@example.com", password="password", student=self.student_female
        )
        
    def test_student_course_auto_generation(self):
        self.assertEqual(self.student_male.course, "DH23CNTT")
        self.assertEqual(self.student_female.course, "DH23CNTT")
    
    def test_student_room_gender_validation(self):
        self.student_male.room = self.room_male
        self.student_male.save()
        self.assertEqual(self.student_male.room, self.room_male)

        self.student_female.room = self.room_male
        with self.assertRaises(ValueError) as context:
            self.student_female.save()
        self.assertIn("chỉ dành cho male", str(context.exception))
    
    def test_student_room_available_slots(self):
        self.student_male.room = self.room_male
        self.student_male.save()
        self.room_male.refresh_from_db()
        self.assertEqual(self.room_male.available_slots, 1) 

        self.student_male.room = self.room_female
        self.student_male.save()
        self.room_male.refresh_from_db()
        self.room_female.refresh_from_db()
        self.assertEqual(self.room_male.available_slots, 2) 
        self.assertEqual(self.room_female.available_slots, 1)  
    
    def test_checkinout_gender_validation(self):
        log = CheckInOutLog(
            student=self.student_male,
            building=self.building_male,
            check_in_time=timezone.now(),
            date=timezone.now().date()
        )
        self.student_male.room = self.room_male
        self.student_male.save()
        log.save()

        log = CheckInOutLog(
            student=self.student_female,
            building=self.building_male,
            check_in_time=timezone.now(),
            date=timezone.now().date()
        )
        self.student_female.room = self.room_female
        self.student_female.save()
        with self.assertRaises(ValueError) as context:
            log.save()
        self.assertIn("không được phép vào tòa", str(context.exception))
    
    def test_contract_id_generation(self):
        contract = Contract.objects.create(
            student=self.student_male,
            room=self.room_male,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=30)
        )
        self.assertEqual(contract.get_contract_id(), "HD0001")
    
    def test_student_admin_course_field_excluded(self):
        client = Client()
        client.force_login(self.user_male)

        response = client.get(reverse('admin:core_student_add'))
        self.assertNotContains(response, 'name="course"')  
        
    def test_student_admin_list_display(self):
        client = Client()
        client.force_login(self.user_male)

        response = client.get(reverse('admin:core_student_changelist'))
        self.assertContains(response, "DH23CNTT")  
        
    