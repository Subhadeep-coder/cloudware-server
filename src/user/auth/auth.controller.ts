import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GoogleLoginDto,
  LoginUserDto,
  RegisterUserDto,
  VerifyUserDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('/verify')
  verifyUser(@Body() verifyUserDto: VerifyUserDto) {
    return this.authService.verify(verifyUserDto);
  }

  @Post('/login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('/google-login')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Post('/refresh')
  refreshToken(@Body() { refreshToken }: { refreshToken: string }) {
    return this.authService.refreshToken(refreshToken);
  }
}
