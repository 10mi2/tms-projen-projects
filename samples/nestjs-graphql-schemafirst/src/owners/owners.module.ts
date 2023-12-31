import { Module } from "@nestjs/common";
import { OwnersService } from "./owners.service.js";

@Module({
  providers: [OwnersService],
  exports: [OwnersService],
})
export class OwnersModule {}
