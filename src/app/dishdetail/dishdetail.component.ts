import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Comment } from '../shared/comment';
import { visibility, expand } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [ visibility(), expand() ]
})
export class DishdetailComponent implements OnInit {

  @ViewChild('fform', null) commentFormDirective;
  
  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  commentForm: FormGroup;
  author: FormControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  rating: FormControl = new FormControl(5);
  comment: FormControl = new FormControl('', [Validators.required]);
  commentModel: Comment;
  errMess: string;
  visibility = 'shown';
  dishcopy: Dish;

  formErrors = {
    'author': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':   'Name is required.',
      'minlength':  'Name must be at least 2 characters long.',
    },
    'comment': {
      'required':   'Comment is required.',
    },
  };

  constructor(
    private dishService: DishService, 
    private route: ActivatedRoute, 
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { 
    this.createForm();
  }

  ngOnInit() {
    this.dishService.getDishIds()
    .subscribe(
      dishIds => this.dishIds = dishIds,
      errmess => this.errMess = <any>errmess);
    
      this.route.params
      .pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(+params['id']); }))
      .subscribe(
        dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => this.errMess = <any>errmess);
  }

  goBack(): void {
    this.location.back();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  createForm(){

    this.commentForm = this.fb.group({
      author: this.author,
      comment: this.comment,
      rating: this.rating
    });

    this.commentForm.valueChanges
    .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.commentModel = this.commentForm.value;
    this.commentModel.date = Date.now().toString();
    this.dishcopy.comments.push(this.commentModel);

    this.dishService.putDish(this.dishcopy)
    .subscribe(
      dish => { this.dish = dish; this.dishcopy = dish; },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; }
    );

    this.commentFormDirective.resetForm();
    this.commentForm.setValue({author:'', rating: 5, comment: ''});
  }
}
