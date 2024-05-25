from django.test import TestCase


# Create your tests here.
def find_palindromes(N):
    palindromes = []
    for i in range(N):
        original_number = 42 + N
        temp = original_number
        reversed_number = 0

        while temp > 0:
            digit = temp % 10
            reversed_number = reversed_number * 10 + digit
            temp = temp // 10

        if original_number == reversed_number:
            palindromes.append(original_number)
    return palindromes
