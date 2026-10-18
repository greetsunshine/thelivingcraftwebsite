import unittest
from decimal import Decimal

from refund_agent import (
    ApprovalRequired,
    AuthorizationError,
    BusinessRuleError,
    EXECUTED_REFUNDS,
    ORDERS,
    Order,
    Principal,
    TrustedApproval,
    demo_principals,
    issue_refund,
    reset_execution_log,
)


class RefundBoundaryTests(unittest.TestCase):
    """Tests are executable security requirements.

    LEARNER EXERCISE: follow README.md and copy the two exact test methods
    into this class at the specified locations. Do not guess where to put them.
    Each negative test must check BOTH the exception and that no refund executed.
    """
    def setUp(self):
        reset_execution_log()
        self.operator, self.read_only = demo_principals()

    def test_valid_300_refund_executes(self):
        result = issue_refund(self.operator, "order-100", 300)
        self.assertEqual(result["status"], "executed")
        self.assertEqual(result["amount"], "300.00")
        self.assertEqual(len(EXECUTED_REFUNDS), 1)

    def test_read_only_identity_is_denied_before_execution(self):
        with self.assertRaises(AuthorizationError):
            issue_refund(self.read_only, "order-100", 300)
        self.assertEqual(EXECUTED_REFUNDS, [])

    def test_refund_above_amount_paid_is_denied_before_execution(self):
        with self.assertRaises(BusinessRuleError):
            issue_refund(self.operator, "order-100", 1200)
        self.assertEqual(EXECUTED_REFUNDS, [])

    def test_700_refund_requires_approval_and_does_not_execute(self):
        with self.assertRaises(ApprovalRequired):
            issue_refund(self.operator, "order-100", 700)
        self.assertEqual(EXECUTED_REFUNDS, [])

    def test_matching_trusted_approval_allows_700_refund(self):
        approval = TrustedApproval("approval-9", "order-100", Decimal("700.00"), "manager-2")
        result = issue_refund(self.operator, "order-100", 700, trusted_approval=approval)
        self.assertEqual(result["status"], "executed")
        self.assertEqual(len(EXECUTED_REFUNDS), 1)

    def test_approval_for_different_amount_is_denied(self):
        approval = TrustedApproval("approval-10", "order-100", Decimal("650.00"), "manager-2")
        with self.assertRaises(AuthorizationError):
            issue_refund(self.operator, "order-100", 700, trusted_approval=approval)
        self.assertEqual(EXECUTED_REFUNDS, [])

    def test_cannot_access_another_order(self):
        ORDERS["order-200"] = Order("order-200", Decimal("900.00"))
        try:
            with self.assertRaises(AuthorizationError):
                issue_refund(self.operator, "order-200", 100)
            self.assertEqual(EXECUTED_REFUNDS, [])
        finally:
            del ORDERS["order-200"]

    def test_non_positive_refund_is_denied(self):
        for amount in (0, -1):
            with self.subTest(amount=amount):
                with self.assertRaises(BusinessRuleError):
                    issue_refund(self.operator, "order-100", amount)
                self.assertEqual(EXECUTED_REFUNDS, [])

    def test_scope_without_permitted_role_is_not_enough(self):
        role_mismatch = Principal(
            subject="other", role="read_only_support",
            scopes=frozenset({"refund:issue"}),
            accessible_order_ids=frozenset({"order-100"}),
        )
        with self.assertRaises(AuthorizationError):
            issue_refund(role_mismatch, "order-100", 100)
        self.assertEqual(EXECUTED_REFUNDS, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
