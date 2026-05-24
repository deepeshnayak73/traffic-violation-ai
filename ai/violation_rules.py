class ViolationRules:
    def __init__(self):
        self.rules = {
            "no_helmet": {
                "description": "Rider without helmet on motorcycle",
                "fine": 1000,
                "severity": "HIGH"
            },
            "no_seatbelt": {
                "description": "Driver/passenger without seatbelt",
                "fine": 500,
                "severity": "MEDIUM"
            }
        }

    def get_rule(self, violation_type):
        return self.rules.get(violation_type, None)

    def get_fine(self, violation_type):
        rule = self.get_rule(violation_type)
        return rule["fine"] if rule else 0

    def get_severity(self, violation_type):
        rule = self.get_rule(violation_type)
        return rule["severity"] if rule else "LOW"

    def format_violation(self, violation):
        rule = self.get_rule(violation["type"])
        if not rule:
            return violation
        return {
            **violation,
            "fine": rule["fine"],
            "severity": rule["severity"],
            "description": rule["description"]
        }