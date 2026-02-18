update public.users
set "passwordHash" = '$2b$12$ioxFvSCeScspn/J55lGNheOQ4d6Bp8YxR0DPkqxK4Yz7n9AafiKRq',
    "updatedAt" = now()
where email = 'admin@100xfounder.com';
