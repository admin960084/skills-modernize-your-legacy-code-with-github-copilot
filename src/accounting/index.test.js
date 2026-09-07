const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { beforeEach, describe, test } = require('node:test');
const path = require('node:path');

const {
  creditAccount,
  debitAccount,
  readBalance,
  writeBalance,
} = require('./index');

const applicationPath = path.join(__dirname, 'index.js');

function runApplication(input) {
  return execFileSync(process.execPath, [applicationPath], {
    input,
    encoding: 'utf8',
  });
}

function assertBalance(balance) {
  assert.equal(readBalance(), balance);
}

beforeEach(() => {
  writeBalance(1000.00);
});

describe('account operations', () => {
  test('TC-002: starts with a balance of 1000.00', () => {
    assertBalance(1000.00);
  });

  test('TC-003: viewing the balance does not change it', () => {
    const balanceBefore = readBalance();

    assertBalance(balanceBefore);
  });

  test('TC-004: credits a whole-dollar amount and stores the new balance', () => {
    creditAccount(100.00);

    assertBalance(1100.00);
  });

  test('TC-005: credits an amount with cents', () => {
    creditAccount(25.50);

    assertBalance(1025.50);
  });

  test('TC-006: applies multiple credits sequentially', () => {
    creditAccount(100.00);
    creditAccount(50.25);

    assertBalance(1150.25);
  });

  test('TC-007: debits an amount when sufficient funds are available', () => {
    debitAccount(200.00);

    assertBalance(800.00);
  });

  test('TC-008: allows a debit equal to the current balance', () => {
    debitAccount(1000.00);

    assertBalance(0.00);
  });

  test('TC-009: rejects a debit greater than the current balance', () => {
    debitAccount(1000.01);

    assertBalance(1000.00);
  });

  test('TC-010: checks insufficient funds against the latest stored balance', () => {
    creditAccount(100.00);
    debitAccount(1100.01);

    assertBalance(1100.00);
  });

  test('TC-011: applies a credit after a debit', () => {
    debitAccount(250.00);
    creditAccount(75.25);

    assertBalance(825.25);
  });

  test('TC-015: accepts a zero credit without changing the balance', () => {
    creditAccount(0.00);

    assertBalance(1000.00);
  });

  test('TC-016: accepts a zero debit without changing the balance', () => {
    debitAccount(0.00);

    assertBalance(1000.00);
  });

  test('TC-021: leaves the balance unchanged after a rejected debit', () => {
    debitAccount(1000.01);

    assertBalance(1000.00);
  });
});

describe('interactive application', () => {
  test('TC-001: displays all menu options', () => {
    const output = runApplication('4\n');

    assert.match(output, /Account Management System/);
    assert.match(output, /1\. View Balance/);
    assert.match(output, /2\. Credit Account/);
    assert.match(output, /3\. Debit Account/);
    assert.match(output, /4\. Exit/);
  });

  test('TC-002 and TC-003: displays the initial balance and preserves it on inquiry', () => {
    const output = runApplication('1\n1\n4\n');

    assert.equal((output.match(/Current balance: 1000\.00/g) || []).length, 2);
  });

  test('TC-004 and TC-005: credits an amount and displays the resulting balance', () => {
    const output = runApplication('2\n25.50\n1\n4\n');

    assert.match(output, /Amount credited\. New balance: 1025\.50/);
    assert.match(output, /Current balance: 1025\.50/);
  });

  test('TC-007 and TC-008: debits sufficient funds and displays the resulting balance', () => {
    const output = runApplication('3\n1000.00\n1\n4\n');

    assert.match(output, /Amount debited\. New balance: 0\.00/);
    assert.match(output, /Current balance: 0\.00/);
  });

  test('TC-009 and TC-021: rejects an over-limit debit without changing the balance', () => {
    const output = runApplication('3\n1000.01\n1\n4\n');

    assert.match(output, /Insufficient funds for this debit\./);
    assert.match(output, /Current balance: 1000\.00/);
  });

  test('TC-012: exits with the goodbye message', () => {
    const output = runApplication('4\n');

    assert.match(output, /Exiting the program\. Goodbye!/);
  });

  test('TC-013: reports an invalid menu selection and continues', () => {
    const output = runApplication('5\n4\n');

    assert.match(output, /Invalid choice, please select 1-4\./);
    assert.match(output, /Exiting the program\. Goodbye!/);
  });

  test('TC-014 and TC-022: reset the in-memory account between application runs', () => {
    const firstRun = runApplication('2\n100.00\n1\n4\n');
    const secondRun = runApplication('1\n4\n');

    assert.match(firstRun, /Current balance: 1100\.00/);
    assert.match(secondRun, /Current balance: 1000\.00/);
  });

  test('TC-017 and TC-018: reject negative and non-numeric amounts without changing the balance', () => {
    const output = runApplication('2\n-10.00\n2\nabc\n1\n4\n');

    assert.equal((output.match(/Invalid amount, please enter a non-negative number\./g) || []).length, 2);
    assert.match(output, /Current balance: 1000\.00/);
  });

  test('TC-019: formats amounts with more than two decimal places to cents', () => {
    const output = runApplication('2\n10.999\n1\n4\n');

    assert.match(output, /Current balance: 1011\.00/);
  });

  test('TC-020: accepts the maximum COBOL amount format without losing the result', () => {
    const output = runApplication('2\n999999.99\n1\n4\n');

    assert.match(output, /Current balance: 1000999\.99/);
  });
});
