
(function(win, doc, $) {
    'use strict';

    /*
    Toogle History
    ====================================================================== */


    /*
    Initial setup of DOM
    -------------------------------------------------------------- */

    if($('.bc-table').length > 0) {

        // creating new element technique copied from http://ejohn.org/apps/workshop/intro/#19
        var $historyLink = $('<a><span></span><i></i></a>')
                           .attr('title', 'View feature history') /* TODO: not #l10n friendly */
                           .addClass('bc-history-link only-icon')
                           .find('i')
                             .attr('aria-hidden', true)
                             .addClass('ic-history')
                           .end();
        var $historySection = $('<section><dl><dt><dd></dd></dt></dl></section>')
                              .addClass('bc-history hidden')
                              .attr('aria-hidden', true)
                              .find('dt')
                                .addClass('bc-supports')
                              .end();
        var $historyCloseButton = $('<button><abbr><span></span><i></i></abbr></button>')
                              .addClass('bc-history-button')
                              .find('abbr')
                                .addClass('only-icon')
                                .attr('title', 'Return to compatability table.') /* TODO: not #l10n friendly */
                              .find('span')
                                .append('Close')/* TODO: not #l10n friendly */
                              .end()
                              .find('i')
                                .addClass('icon-times')
                                .attr('aria-hidden', true)
                              .end()
                              .end();
        var historyCount = 0;

        // javascript is enabled, hide the footnotes and legend
        $('.bc-footnotes').hide().attr('aria-hidden', true);
        //$('.bc-legend:not(#bc-legend-master)').hide().attr('aria-hidden', true);

        // generate info for cells with no info (legend, no history available, prompt to contribute)
        var $cells = $('.bc-table td');

        $cells.each(function () {

            var $thisCell = $(this);
            // console.log($thisCell);

            // check if it already has a bc-history
            var hasHistory = $thisCell.children('.bc-history').length;
            if (hasHistory < 1) {
                // console.log('no history');
                // if not check for icons
                var $icons = $thisCell.children('.bc-icons');
                var hasIcons = $icons.length;

                if(hasIcons > 0) {
                    // console.log('has icons ');

                    // change variable indicating if there's a history, since we're adding it
                    hasHistory = true;

                    // create the history section
                    var $thisHistorySection = $historySection.clone();

                    // create the history DD
                    var $thisHistoryDD = $thisHistorySection.find('dd');

                        // add icon explanations to history
                        $icons.find('abbr').each(function() {
                            var $abbr = $(this);
                            var $newAbbr = $abbr.clone();
                            var isFootnote = $newAbbr.find('.ic-footnote');

                            // add icon to definition
                            $newAbbr.appendTo($thisHistoryDD);

                            // add defintiion
                            if(isFootnote.length < 1) {
                                // straight forward copy of title if it's not a footnote
                                var title = $newAbbr.attr('title');
                                $thisHistoryDD.append(title);
                            } else {
                                // locate the actual footnote and copy it into the defintion
                                var $thisFootnote = $abbr.parent();
                                var thisFootnoteLink = $thisFootnote.attr('href');
                                var $newFootnote = $(thisFootnoteLink);
                                var definition;
                                // this is either in a dt/dd format or a p, needs to be treated differently
                                if($newFootnote.is('p')) {
                                    definition = $newFootnote.html();
                                    $thisHistoryDD.append(definition);
                                } else if($newFootnote.is('dt')) {
                                    definition = $newFootnote.next('dd').html();
                                    $thisHistoryDD.append(definition);
                                } // there's a problem if it's not one of those two :P

                                // once we've got that, remove the anchor from the original
                                $abbr.unwrap();
                            }
                        });

                    // create the history DT
                    var $thisHistoryDT= $thisHistorySection.find('dt');
                    $thisHistoryDT.append($thisCell.html());
                    // copy cell support class
                        // TODO: regex this so not dependent on what is essentially a lookup table.
                        if($thisCell.hasClass('bc-supports-yes')) {
                            $thisHistoryDT.addClass('bc-supports-yes');
                        } else if($thisCell.hasClass('bc-supports-partial')) {
                            $thisHistoryDT.addClass('bc-supports-partial');
                        } else if($thisCell.hasClass('bc-supports-no')) {
                            $thisHistoryDT.addClass('bc-supports-no');
                        } else if($thisCell.hasClass('bc-supports-unknown')) {
                            $thisHistoryDT.addClass('bc-supports-unknown');
                        };

                    // create the history link in the cell (do last so not cloned)
                    $historyLink.clone().appendTo($thisCell);

                    // apend the history section
                    $thisHistorySection.appendTo($thisCell);

                } // if(hasIcons)

            } else {
                // already has history, needs to have link href removed so that anchor isn't keyboard focusable
                $thisCell.find('.bc-history-link').removeAttr('href');
                $thisCell.find('.bc-icons a .ic-footnote').parent().unwrap();
            } // if (hasHistory < 1)

            // TODO? check if it is unknown and add call to contribute?

            // now add listeners if the cell has history
            // doing this seperate from above if because it may have changed
            if(hasHistory > 0) {
                // get history
                var $thisHistory = $thisCell.find('.bc-history');

                // check for ID
                var historyId = $thisHistory.attr('id');

                if(!historyId) {
                    //console.log('no history ID');
                    historyId = 'bc-';
                    historyId += historyCount;
                    historyCount ++;
                    $thisHistory.attr('id', historyId);
                }

                // increase acessability
                $thisCell.attr('tabindex', 0)
                         .attr('aria-expanded', false)
                         .attr('aria-controls', historyId);

                // add close button
                var $thisHistoryCloseButton = $historyCloseButton.clone();
                $thisHistoryCloseButton.on('click', function(event){ hideHistory($thisCell); }); /* click should trigger on tap and key*/
                $thisHistoryCloseButton.appendTo($thisHistory);


                // add event listeners
                $thisCell.on('click touchstart keydown', function(event){ toggleHistory(event, $thisCell); });
            } // if(hasHistory > 0)

        }); // $cells.each()

    }

    /*
    showHistory
    -------------------------------------------------------------- */

    function showHistory($thisCell) {
        // close all open histories
        var $activeCells = $('.bc-table td.active');
        $activeCells.each( function() {
            var $thisActiveCell = $(this);
            hideHistory($thisActiveCell);
        });

        // console.log('show');
        var $thisTable = $thisCell.parents('.bc-table');
        var $thisRow = $thisCell.closest('tr');
        var $thisHistory = $thisCell.children('.bc-history');

        // calculate shape of history
        // we calculate this each time incase the window has been resized

        // measure the width of the table
        var tableWidth = $thisTable.width();
        $thisHistory.outerWidth(tableWidth + 'px');

        // place history on page relative to its cell
        // TODO: is this RTL friendly?!?!

            // left

            // get cell coords
            var cellLeft = $thisCell.offset().left;
            // console.log('cellLeft = ' + cellLeft);

            // get cell left border
            var cellLeftBorder = $thisCell.css('border-left-width');

            // get table coords
            var tableLeft = $thisTable.offset().left;
            // console.log('tableLeft = ' + tableLeft);

            // left coord of table minus left coord of cell
            var historyLeft = tableLeft - cellLeft - parseInt(cellLeftBorder) - 1;
            // console.log('historyLeft = ' + historyLeft);


            // top
            // can't just to top:100% in CSS because IE messes it up.

            // get cell height
            var cellTop = $thisCell.outerHeight();

            // get cell top border
            var celltopBorder = $thisCell.css('border-top-width');

            // get cell bottom border
            var cellBottomBorder = $thisCell.css('border-bottom-width');

            var historyTop = cellTop - parseInt(cellBottomBorder) - parseInt(celltopBorder);

            // move history where it will display
            $thisHistory.css('left', historyLeft + 'px');
            $thisHistory.css('top', historyTop + 'px');


        // measure height
        $thisHistory.css('display', 'block');
        $thisHistory.attr('aria-hidden', false);
        var historyHeight = $thisHistory.outerHeight();
        // console.log(historyHeight);

        // set max-height to 0 and visibility to visible
        $thisCell.addClass('active');
        $thisCell.attr('aria-expanded', true);
        // need ever so slight a delay here so that browser has applied previous item
        setTimeout(function() {
            $thisHistory.css('height', historyHeight + 'px');
            // add measured height to history and to the cell/row it is being displayed beneath (CSS handles transition)
            if(window.innerWidth > 801) {
                $thisRow.find('th, td').css('border-bottom', historyHeight + 'px solid transparent');
            } if(window.innerWidth > 481) {
                $thisRow.find('td').css('border-bottom', historyHeight + 'px solid transparent');
            } else {
                $thisCell.css('border-bottom', historyHeight + 'px solid transparent');
            }
        }, 10);

    }

    /*
    hideHistory
    -------------------------------------------------------------- */

    function hideHistory($thisCell){
        // console.log('hide');

        $thisCell.css('border-bottom', '');
        $thisCell.attr('aria-expanded', false);

        var $thisRow = $thisCell.closest('tr');
        $thisRow.find('th, td').css('border-bottom', '');

        var $thisHistory = $thisCell.children('.bc-history');
        $thisHistory.css('height', '');
        $thisHistory.attr('aria-hidden', true);

        // if the focus is inside the .bc-history and we'd lose our keyboard place, move focus to parent
        var hasFocus = document.activeElement;
        if($.contains($thisCell.get(0), hasFocus)) {
            console.log('changing focus');
            $thisCell.focus();
        }

        setTimeout(function() {
            $thisCell.removeClass('active');
            $thisHistory.css('display', 'none');
        }, 200);

    }

    /*
    toggleHistory
    -------------------------------------------------------------- */

    function toggleHistory(event, $thisCell) {
        //console.log('toggleHistory');

        // only toggle for interactions on the parent cell, and not on expanded history info
        // so that copy/paste and link following is possible
        var $thisTarget = $(event.target);
        if($thisTarget.parents('.bc-history').length > 0) {
            return;
        }

        if($thisTarget.hasClass('.bc-history')) {
            hideHistory($thisCell);
            return
        }

        if(event.type == 'keydown') {
            if(event.which === 13 || event.which === 32) {
                if($thisCell.hasClass('active')) {
                    hideHistory($thisCell);
                    event.preventDefault();
                    return false;
                } else {
                    showHistory($thisCell);
                    event.preventDefault();
                    return false;
                }
            } else if(event.which === 27) {
                hideHistory($thisCell);
                event.preventDefault();
                return false;
            } else {
                return;
            }
        }

        if($thisCell.hasClass('active')) {
            hideHistory($thisCell);
            event.preventDefault();
            return false;
        } else {
            showHistory($thisCell);
            event.preventDefault();
            return false;
        }

    }


    /*
    Toogle support on smaller viewports if more than 1 row
    ====================================================================== */








})(window, document, jQuery);
