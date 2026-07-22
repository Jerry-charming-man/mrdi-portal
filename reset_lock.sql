SET search_path TO mdm; UPDATE "User" SET failed_login_count = 0, locked_until = NULL WHERE email = 'jerry@mrdi.com';
