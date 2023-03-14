import { Entity, PrimaryGeneratedColumn, Column, Check, ManyToOne, Relation } from 'typeorm';
import { User } from './User';
import { Book } from './Book';

@Entity()
@Check('rating >= 0 and rating <= 5')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  reviewId: string;

  @Column()
  rating: number;

  @Column()
  reviewText: string;

  @ManyToOne(() => User, (user) => user.reviews)
  user: Relation<User>;

  @ManyToOne(() => Book, (book) => book.reviews)
  book: Relation<Book>;
}
