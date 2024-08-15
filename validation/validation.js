const validateEmailFormat = (email) => {
  const atposition = email.indexOf('@');
  if (atposition < 1) return false;

  const dotposition = email.indexOf('.', atposition);
  if (dotposition <= atposition + 1) return false;

  if (dotposition === email.length - 1) return false;

  const spechar = /[!#$%^&*()+=\[\]{};':"\\|,<>\/?]+/;
  if (spechar.test(email)){
    return false
  }

  return true;
};

const validateEmptyFields = (fields) => {
  for (const field in fields) {
      if (!fields[field]) {
          return false;
      }
  }
  return true;
};

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;

  let UpperCase = false;
  let LowerCase = false;
  let Number = false;
  let SpecialChar = false;
  const speChars= "@$!%*?&";

  for (const char of password) {
      if (char >= 'A' && char <= 'Z') UpperCase = true;
      else if (char >= 'a' && char <= 'z') LowerCase = true;
      else if (char >= '0' && char <= '9') Number = true;
      else if (speChars.includes(char)) SpecialChar = true;

      if (UpperCase && LowerCase && Number && SpecialChar) {
          return true;
      }
  }

  return false;
};

const validateSignup = (req, res, next) => {
  const { name, email, password, otp} = req.body;

  if (!validateEmptyFields({ name, email, password, otp })) {
      return res.status(400).json({
          message: 'All fields are required.',
      });
  }

  if (!validateEmailFormat(email)) {
      return res.status(400).json({
          message: 'Invalid email format.',
      });
  }

  if (!validatePasswordStrength(password)) {
      return res.status(400).json({
          message: 'Password must minimum have 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.',
      });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { name, password } = req.body;

  if (!validateEmptyFields({ name, password })) {
      return res.status(400).json({
          message: 'All fields are required.',
      });
  }

  next();
};


module.exports = {
  validateSignup,
  validateLogin,
};
