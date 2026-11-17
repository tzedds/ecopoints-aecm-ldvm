INSERT INTO materials (name, unit, points_per_unit) VALUES
    ('Papel y cartón','kg',2),
    ('Plástico PET','kg',5),
    ('Vidrio','kg',3),
    ('Latas de aluminio','kg',8),
    ('Pilas usadas','pieza',10),
    ('Tapas de plástico','kg',4)
ON CONFLICT (name) DO NOTHING;

-- Usuarios de demostración (contraseña: Demo1234!)
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Ana Participante','participante@ecopoints.test',
        crypt('Demo1234!', gen_salt('bf', 10)), 'participant'),
    ('Eli Encargado', 'encargado@ecopoints.test',
        crypt('Demo1234!', gen_salt('bf', 10)), 'manager')
ON CONFLICT (email) DO NOTHING;