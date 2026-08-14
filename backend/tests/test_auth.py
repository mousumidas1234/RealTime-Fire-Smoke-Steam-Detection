import unittest

from app.auth import authenticate_user


class AuthTests(unittest.TestCase):
    def test_admin_credentials_work(self):
        user = authenticate_user("admin", "admin123")
        self.assertIsNotNone(user)
        self.assertEqual(user["role"], "admin")

    def test_unknown_user_fails(self):
        self.assertIsNone(authenticate_user("ghost", "wrong"))

    def test_wrong_admin_password_fails(self):
        self.assertIsNone(authenticate_user("admin", "wrong"))


if __name__ == "__main__":
    unittest.main()
