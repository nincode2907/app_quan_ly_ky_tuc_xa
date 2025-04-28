from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Student, SupportRequest, User, Faculty
from .utils import generate_random_password

class StudentForm(forms.ModelForm):
    class Meta:
        model = Student
        fields = '__all__'
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
        }
        
class CustomUserCreationForm(UserCreationForm):
    full_name = forms.CharField(max_length=150, required=True)
    gender = forms.ChoiceField(choices=Student.GENDER_CHOICES, required=True, label="Giới tính")
    faculty = forms.ModelChoiceField(queryset=Faculty.objects.all(), required=True)
    year_start = forms.IntegerField(required=True)
    password1 = forms.CharField(widget=forms.HiddenInput, required=False)
    password2 = forms.CharField(widget=forms.HiddenInput, required=False)

    class Meta:
        model = User
        fields = ('email', 'password1', 'password2', 'full_name', 'gender', 'faculty', 'year_start', 'is_admin', 'is_first_login')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        password = generate_random_password()
        self.initial['password1'] = password 
        self.initial['password2'] = password
        self.fields['is_first_login'].initial = True
        
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1', self.initial.get('password1'))
        password2 = cleaned_data.get('password2', self.initial.get('password2'))
        if password1 != password2:
            raise forms.ValidationError("Mật khẩu không khớp.")
        return cleaned_data

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ('email', 'phone', 'avatar', 'is_staff', 'is_superuser', 'is_admin', 'is_first_login')
        
class SupportRequestAdminForm(forms.ModelForm):
    RESPONSE_CHOICES = (
        ('default', 'Mặc định'),
        ('custom', 'Tùy chỉnh'),
    )
    response_type = forms.ChoiceField(choices=RESPONSE_CHOICES, label="Loại phản hồi", required=False)
    custom_response = forms.CharField(widget=forms.Textarea, label="Phản hồi tùy chỉnh", required=False)

    class Meta:
        model = SupportRequest
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        response_type = cleaned_data.get('response_type')
        custom_response = cleaned_data.get('custom_response')
        status = cleaned_data.get('status')

        if status in ['APPROVED', 'REJECTED']:
            if not response_type:
                raise forms.ValidationError("Vui lòng chọn loại phản hồi.")
            if response_type == 'custom' and not custom_response:
                raise forms.ValidationError("Vui lòng nhập phản hồi tùy chỉnh.")