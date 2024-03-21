const inquirer = require("inquirer");
const server = require("./server");

// Create an array of questions for user input
const questions = [
  {
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View All Employee",
      "Add Employee",
      "Update Employee Role",
      "View All Roles",
      "Add Role",
      "View All Departments",
      "Add Department",
      "Update Employee Manager",
      "View Employees by Manager",
      "View Employees by Department",
      "Delete Department",
      "Delete Roles",
      "Delete Employees",
      "View the total utilized budget",
      "Quit",
    ],
    name: "Initial",
  },
];

// Create a function to initialize app; investigate switch case
function init() {
  inquirer.prompt(questions).then((data) => {
    if (data.Initial === "Add Employee") {
      addEmployee();
    } else if (data.Initial === "View All Employee") {
      viewAllEmployee();
    } else if (data.Initial === "Update Employee Role") {
      updateEmployeeRole();
    } else if (data.Initial === "View All Roles") {
      viewAllRoles();
    } else if (data.Initial === "Add Role") {
      addRole();
    } else if (data.Initial === "View All Departments") {
      viewAllDepartments();
    } else if (data.Initial === "Add Department") {
      addDepartment();
    } else if (data.Initial === "Update Employee Manager") {
      updateEmployeeManager();
    } else if (data.Initial === "View Employees by Manager") {
      viewEmployeesByManager();
    } else if (data.Initial === "View Employees by Department") {
      viewEmployeesByDepartment();
    } else if (data.Initial === "Delete Department") {
      deleteDepartment();
    } else if (data.Initial === "Delete Roles") {
      deleteRoles();
    } else if (data.Initial === "Delete Employees") {
      deleteEmployee();
    } else if (data.Initial === "View the total utilized budget") {
      viewTotalBudget();
    } else if (data.Initial === "Quit") {
      server.end();
    }
  });
}

// View all employees
const viewAllEmployee = async () => {
  try {
    const [employees] = await server
      .promise()
      .query(
        "SELECT employees.id, employees.first_name, employees.last_name, role.title AS role, CONCAT(manager.first_name, ' ', manager.last_name) as manager FROM employees LEFT JOIN role ON employees.role_id = role.id LEFT JOIN employees manager ON employees.manager_id = manager.id"
      );

    console.table(employees);
    setTimeout(init, 3000);
  } catch (error) {
    console.log(error);
  }
};

// Add employee
const addEmployee = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
      },
    ]);

    const crit = [answer.firstName, answer.lastName];
    const roleSql = `SELECT role.id, role.title FROM role`;
    const [roleChoice] = await server.promise().query(roleSql);

    const roles = roleChoice.map(({ id, title }) => ({
      name: title,
      value: id,
    }));
    const { role } = await inquirer.prompt([
      {
        type: "list",
        name: "role",
        message: "What is the employee's role?",
        choices: roles,
      },
    ]);

    crit.push(role);
    const managerSql = `SELECT * FROM employees`;
    const [managersData] = await server.promise().query(managerSql);

    const managers = managersData.map(({ id, first_name, last_name }) => ({
      name: first_name + " " + last_name,
      value: id,
    }));
    const { manager } = await inquirer.prompt([
      {
        type: "list",
        name: "manager",
        message: "What is the employee's manager?",
        choices: managers,
      },
    ]);

    crit.push(manager);
    const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
            VALUES (?, ?, ?, ?)`;
    await server.promise().query(sql, crit);
    console.log("Employee has been added");
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// Update employee role
const updateEmployeeRole = async () => {
  try {
    const employeeSql =
      "SELECT employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS full_name FROM employees";
    const [chosenEmployee] = await server.promise().query(employeeSql);
    const employeeChoices = chosenEmployee.map((emp) => ({
      name: emp.full_name,
      value: emp.id,
    }));

    const roleSql = "SELECT role.id, role.title FROM role";
    const [roles] = await server.promise().query(roleSql);
    const roleChoices = roles.map((role) => ({
      name: role.title,
      value: role.id,
    }));

    const answers = await inquirer.prompt([
      {
        name: "chosenEmployee",
        type: "list",
        message: "Which employee has a new role?",
        choices: employeeChoices,
      },
      {
        name: "chosenRole",
        type: "list",
        message: "What is their new role?",
        choices: roleChoices,
      },
    ]);

    await server
      .promise()
      .query("UPDATE employees SET role_id = ? WHERE id = ?", [
        answers.chosenRole,
        answers.chosenEmployee,
      ]);

    console.log("Employee role updated successfully.");
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// View all roles
const viewAllRoles = async () => {
  try {
    const [rolesWithDepartments] = await server.promise().query(`
        SELECT role.id, role.title, department.department_name AS department_name
        FROM role
        INNER JOIN department ON role.department_id = department.id
      `);

    console.table(rolesWithDepartments);
    setTimeout(init, 3000);
  } catch (error) {
    console.log(error);
  }
};

// Add role
const addRole = async () => {
  try {
    const [deptNames] = await server
      .promise()
      .query("SELECT department.department_name AS department FROM department");

    const choices = deptNames.map((dept) => dept.department);

    const answer = await inquirer.prompt([
      {
        name: "departmentName",
        type: "list",
        message: "Which department is this new role in?",
        choices: choices,
      },
    ]);

    if (answer.departmentName === "") {
      addDepartment();
    } else {
      await addRoleResume(answer);
    }
  } catch (error) {
    console.log("Error adding role:", error);
  }
};

// Finish adding role
const addRoleResume = async () => {
  try {
    const { newRole, salary } = await inquirer.prompt([
      {
        name: "newRole",
        type: "input",
        message: "What is the name of your new role?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary of this new role?",
      },
    ]);

    const [role] = await server
      .promise()
      .query(
        "UPDATE employees JOIN role ON employees.role_id = role.id SET role.title = 'newRole', role.salary = salary WHERE role.id = employees.role_id;"
      );
    viewAllRoles();
    setTimeout(init, 3000);
    // Add the new role to the database using departmentId, newRole, and salary
  } catch (error) {
    console.log(error);
  }
};

// View departments
const viewAllDepartments = async () => {
  const [department] = await server
    .promise()
    .query(
      "SELECT department.id AS id, department.department_name AS department FROM department"
    );
  console.table(department);
  setTimeout(init, 3000);
};

// Add department
const addDepartment = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        name: "newDepartment",
        type: "input",
        message: "What is the name of your new Department?",
      },
    ]);

    let sql = `INSERT INTO department (department_name) VALUES (?)`;
    await server.promise().query(sql, [answer.newDepartment]);

    console.log("Department has been added");
    viewAllDepartments();
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// Update employee's manager
const updateEmployeeManager = async () => {
  try {
    // Fetch all employees
    const [employees] = await server
      .promise()
      .query(
        `SELECT employees.id, employees.first_name, employees.last_name, role.title AS role FROM employees JOIN role ON employees.role_id = role.id`
      );

    // Prepare employee choices for inquirer prompt
    const employeeChoices = employees.map((employee) => ({
      name: `${employee.first_name} ${employee.last_name} - ${employee.role}`, // Display name and role
      value: employee.id, // Actual value to use is the employee ID
    }));

    // Prompt user to choose an employee
    const { chosenEmployee } = await inquirer.prompt([
      {
        name: "chosenEmployee",
        type: "list",
        message: "Please choose an employee.",
        choices: employeeChoices,
      },
    ]);

    // Fetch potential managers
    const [managers] = await server
      .promise()
      .query(
        "SELECT id, CONCAT(first_name, ' ', last_name) as Manager FROM employees"
      );

    // Prepare manager choices for inquirer prompt
    const managerChoices = managers.map((manager) => ({
      name: manager.Manager, // Display name for readability
      value: manager.id, // Actual value to use is the manager ID
    }));

    // Prompt user to choose a manager for the selected employee
    const { chosenManager } = await inquirer.prompt([
      {
        name: "chosenManager",
        type: "list",
        message: "Please choose the employee's new manager.",
        choices: managerChoices,
      },
    ]);

    // Update the employee's manager in the database
    await server
      .promise()
      .query(`UPDATE employees SET manager_id = ? WHERE id = ?`, [
        chosenManager, // Manager ID
        chosenEmployee, // Employee ID
      ]);

    console.log("Employee manager updated successfully.");
    viewAllEmployee();
    setTimeout(init, 3000);
  } catch (err) {
    console.error(err);
  }
};

// View employees by manager
const viewEmployeesByManager = async () => {
  try {
    const [managerList] = await server.promise().query(
      `SElECT CONCAT(e.first_name, ' ',e.last_name) as employee, m.manager_id 
        FROM employees e 
        JOIN employees m ON e.id = m.manager_id`
    );
    const managers = managerList.map((role) => ({
      name: role.employee,
      value: {
        name: role.employee,
        managerId: role.manager_id,
      },
    }));

    const selectedManager = await inquirer.prompt([
      {
        name: "listManager",
        type: "list",
        message: "Please choose the manager.",
        choices: managers,
      },
    ]);
    console.log(selectedManager);
    const [employeeList] = await server.promise().query(`
        SELECT employees.id AS id, CONCAT(employees.first_name, ' ', employees.last_name) AS employee, manager_id
        FROM employees
        WHERE employees.manager_id = ${selectedManager.listManager.managerId}
        `);
    console.log(employeeList);

    const listOfEmployees = employeeList.map((role) => ({
      employee: role.employee,
      id: role.id,
    }));

    console.table(listOfEmployees);
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// View employeess by Department they are in
const viewEmployeesByDepartment = async () => {
  try {
    const [departmentName] = await server.promise()
      .query(`SELECT department.id, department_name, employees.id, CONCAT(employees.first_name, ' ', employees.last_name) AS employee
      FROM department
      JOIN role ON department.id = role.department_id
      JOIN employees ON role.id = employees.role_id;
    `);

    console.log(departmentName);

    const employeeList = departmentName.map((department) => ({
      departmentName: department.department_name,
      employeeName: department.employee,
      value: {
        departmentName: department.department_name,
        departmentId: department.id,
      },
    }));

    const departments = employeeList.map((employee) => employee.departmentName);

    const { selectedDepartment } = await inquirer.prompt([
      {
        name: "selectedDepartment",
        type: "list",
        message: "Please choose the department.",
        choices: departments,
      },
    ]);

    console.log("employeelist", employeeList);

    const employeeName = employeeList.map((person) => ({
      name: person.employeeName,
      departmentID: person.value.departmentId,
    }));

    const filteredEmployees = employeeList.filter(
      (employee) => employee.departmentName === selectedDepartment
    );

    console.log("Employees in department:", selectedDepartment);
    console.table(filteredEmployees);
    setTimeout(init, 3000);
  } catch (err) {
    console.log(err);
  }
};

// Delete selected department
const deleteDepartment = async () => {
  try {
    const [chosenDepartment] = await server
      .promise()
      .query("SELECT id, department_name FROM department");

    const departmentList = chosenDepartment.map((department) => ({
      id: department.id,
      departmentName: department.department_name,
    }));

    const department = departmentList.map(
      (department) => department.departmentName
    );

    const { departmentId } = await inquirer.prompt([
      {
        name: "departmentId",
        type: "list",
        message: "Please choose the department to delete:",
        choices: department,
      },
    ]);

    const selectedDepartment = departmentList.find(
      (dept) => dept.departmentName === departmentId
    );

    if (selectedDepartment) {
      const deleteDepartmentQuery = `DELETE FROM department WHERE id = ?`;
      await server
        .promise()
        .query(deleteDepartmentQuery, [selectedDepartment.id]);

      console.log("Department has been deleted");
      viewAllDepartments();
      setTimeout(init, 3000);
    } else {
      console.log("Department not found. Please select a valid department.");
    }
  } catch (error) {
    console.error(error);
  }
};

// Delete role
const deleteRoles = async () => {
  try {
    const [chosenDelete] = await server
      .promise()
      .query(`SELECT role.id, role.title FROM role`);

    const toDelete = chosenDelete.map((role) => ({
      id: role.id,
      title: role.title,
    }));

    const roleTitles = toDelete.map((role) => role.title);

    const { roleId } = await inquirer.prompt([
      {
        name: "roleId",
        type: "list",
        message: "Please choose the role to delete",
        choices: roleTitles,
      },
    ]);

    const selectedRole = toDelete.find((role) => role.title === roleId);

    if (selectedRole) {
      const deleteRoleQuery = "DELETE FROM role WHERE id = ?";
      await server.promise().query(deleteRoleQuery, [selectedRole.id]);

      console.log("Role has been deleted");
      viewAllRoles();
      setTimeout(init, 3000);
    } else {
      console.log("Role not found. Please select a valid role.");
    }
  } catch (error) {
    console.error(error);
  }
};

// Delete Employee
const deleteEmployee = async () => {
  try {
    const [employees] = await server
      .promise()
      .query(
        `SELECT id, CONCAT(first_name, ' ', last_name) AS employee FROM employees`
      );

    const employeeDelete = employees.map((employee) => ({
      name: employee.employee,
      value: employee.id,
    }));

    const { id } = await inquirer.prompt([
      {
        type: "list",
        name: "id",
        message: "Select the employee you want to delete:",
        choices: employeeDelete,
      },
    ]);

    const selectedEmployee = employeeDelete.find(
      (employee) => employee.value === id
    );

    if (selectedEmployee) {
      const deleteEmployeeQuery = `DELETE FROM employees WHERE id = ?`;
      await server.promise().query(deleteEmployeeQuery, [id]);

      console.log("Employee has been deleted");
      viewAllEmployee();
      setTimeout(init, 3000);
    } else {
      console.log("Employee not found.");
    }
  } catch (error) {
    console.log(error);
  }
};

// Total Budget
const viewTotalBudget = async () => {
  try {
    const budget = await server.promise().query(`
    SELECT title, salary
    FROM role
    UNION ALL
    SELECT 'Total Salary', SUM(salary)
    FROM role;
  `);

    console.log(budget);
    setTimeout(init, 3000);
  } catch (error) {
    console.log(error);
  }
};

// Function call to initialize app
init();
