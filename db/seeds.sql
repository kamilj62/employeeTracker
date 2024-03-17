INSERT INTO department (department_name) VALUES 
("Accounting"),
("Legal"),
("Data"),
("Engineering");
        
INSERT INTO role (title, salary, department_id) VALUES 
("senior accountant", 180000, 1),
("junior accountant", 120000, 1),
("Head Lawyer", 200000, 2),
("Lawyer", 150000, 2),
("Senior Data Analyst", 150000, 3),
("Data Analyst", 100000, 3),
("Senior Engineer", 170000, 4),
("Engineer", 120000, 4);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id) VALUES 
(001, "Joseph", "Kamil", 7, NULL),
(002, "Cassius", "Kamil", 8, 1);




