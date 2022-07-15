#lang racket
(require racket/trace)
(require syntax/location)

(define (process stx) 
	(display (quote-source-file)))

(define-syntax (assert stx)
  	(syntax-case () 
		((_ a ...)
		 #`(process (list a ...)))))



(provide assert)

;	(syntax-case stx () ((_ a) 
;		#'(printf "~a\n" a)))
