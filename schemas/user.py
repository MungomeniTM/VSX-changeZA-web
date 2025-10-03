from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True
        
from pydantic import BaseModel

class UserBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str
    role: str | None = None
    location: str | None = None

class UserOut(UserBase):
    id: int
    class Config:
        orm_mode = True
