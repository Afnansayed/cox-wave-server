export interface ICreateOwner {
  password: string;
  owner: {  
  name: string;
  email: string;

  profile_picture?: string;
  phone_number?: string;
  address?: string;

  business_name: string;
  description?: string;
  business_address?: string;

  trade_license?: string;
  bank_account: string;
  }
}