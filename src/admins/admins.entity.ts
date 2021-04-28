import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

@Entity()
export class Admin {
  @ApiProperty({ example: 1, description: "ID of Admin" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ example: 'test@example.com', description: "Admins' e-mail address" })
  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @ApiProperty({ example: 'admin', description: "Admins' role" })
  @Column()
  role: string
}
