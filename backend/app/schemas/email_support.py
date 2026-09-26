from pydantic import BaseModel


class EmailRequest(BaseModel):
    customer_name: str
    customer_email: str
    subject: str
    message: str