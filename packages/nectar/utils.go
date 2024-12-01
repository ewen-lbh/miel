package main

import "github.com/emersion/go-imap/v2"

func contains[T comparable](s []T, e T) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func seqsetSize(seqset imap.SeqSet) int {
	nums, _ := seqset.Nums()
	return len(nums)
}

func noop() {

}

