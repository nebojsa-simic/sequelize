var chai      = require('chai')
  , Sequelize = require('../index')
  , expect    = chai.expect
  , Support   = require(__dirname + '/support')
  , DataTypes = require(__dirname + "/../lib/data-types")
  , dialect   = Support.getTestDialect()
  , config    = require(__dirname + "/config/config")
  , datetime  = require('chai-datetime');

chai.use(datetime);
chai.Assertion.includeStack = true;

describe("DAO translatable", function () {

  var Page = null;

  beforeEach(function(done) {
    User = this.sequelize.define(
      'UserCol', 
      {
        id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true, 
          autoIncrement: true 
        },
        username: { 
          type: Sequelize.STRING, 
          defaultValue: 'Username' 
        },
      }
    );

    Page = this.sequelize.define(
      'PageCol', 
      {
        id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true, 
          autoIncrement: true 
        },
        title: { 
          type: Sequelize.STRING, 
          defaultValue: 'Page title' 
        },
        visibility: { 
          type: Sequelize.BOOLEAN, 
          defaultValue: false 
        },
        unit: { 
          type: Sequelize.STRING, 
          defaultValue: 'Unit' 
        }
      },
      {
        translatable: ["title", "visibility"]
      }
    );
    done();
  })

  it('adds the setDefaultLocale and getDefaultLocale methods to the model if the translatable option is used', function (done) {
    expect(Page.setDefaultLocale).to.exist;
    expect(Page.getDefaultLocale()).to.equal("en_US");
    done();
  });

  it('does not add the setDefaultLocale and getDefaultLocale methods to the model if the translatable option is not used', function (done) {
    expect(User.setDefaultLocale).to.not.exist;
    expect(User.getDefaultLocale).to.not.exist;
    done();
  });

  it('creates the second translation table if the translatable option is used', function (done) {
    var self = this;
    Page.sync({force: true}).success(function () {
      self.sequelize.getQueryInterface().showAllTables().success(function(tables) {
        expect(tables).to.have.length(2);
        done();
      });
    });
  });

  it('does not create the second translation table if the translatable option is not used', function (done) {
    var self = this;
    User.sync({force: true}).success(function () {
      self.sequelize.getQueryInterface().showAllTables().success(function(tables) {
        expect(tables).to.have.length(1);
        done();
      });
    });
  });
 
  it('creates and loads the data with the default locale', function(done) {
    Page.sync({force: true}).success(function () {
      Page.setDefaultLocale("en_US");

      Page.create({ title: "title en", visibility: true }).success(function (createdpage) {
        expect(createdpage.locale).to.equal("en_US");
        expect(createdpage.title).to.equal("title en");
        expect(createdpage.visibility).to.equal(true);

        Page.find({ where: { id: createdpage.id } }).success(function(loadedpage) {
          expect(loadedpage.locale).to.equal("en_US");
          expect(loadedpage.title).to.equal("title en");
          expect(loadedpage.visibility).to.equal(true);

          done();
        });
      });
    });
  });

  it('creates and loads the data with the given locale', function(done) {
    Page.sync({force: true}).success(function () {
      Page.setDefaultLocale("en_US");

      Page.create({ title: "title de", visibility: true, locale: "de_AT" }).success(function (createdpage) {
        expect(createdpage.locale).to.equal("de_AT");
        expect(createdpage.title).to.equal("title de");
        expect(createdpage.visibility).to.equal(true);

        Page.find({ where: { id: createdpage.id, locale: "de_AT" }}).success(function(loadedpage) {
          expect(loadedpage.locale).to.equal("de_AT");
          expect(loadedpage.title).to.equal("title de");
          expect(loadedpage.visibility).to.equal(true);

          done();
        });
      });
    });
  });

  it('creates and loads the data with the fuzzy matching of locales', function(done) {
    Page.sync({force: true}).success(function () {
      Page.setDefaultLocale("en_US");

      Page.create({ title: "title de", visibility: true, locale: "de" }).success(function (createdpage) {
        expect(createdpage.locale).to.equal("de");
        expect(createdpage.title).to.equal("title de");
        expect(createdpage.visibility).to.equal(true);

        Page.find({ where: { id: createdpage.id, locale: "de_AT" }}).success(function(loadedpage) {
          expect(loadedpage.locale).to.equal("de");
          expect(loadedpage.title).to.equal("title de");
          expect(loadedpage.visibility).to.equal(true);

          done();
        });
      });
    });
  });

  it('creates the data with the default locale and translates the contents with locale', function(done) {
    Page.sync({force: true}).success(function () {
      Page.setDefaultLocale("en_US");

      Page.create({ title: "title en", visibility: true }).success(function (createdpage) {
        createdpage.locale = "de_AT";
        createdpage.title = "title de";
        createdpage.visibility = false;

        createdpage.save().success(function (anotherpage) {
          expect(anotherpage.locale).to.equal("de_AT");
          expect(anotherpage.title).to.equal("title de");
          expect(anotherpage.visibility).to.equal(false);

          Page.find({ where: { id: createdpage.id } }).success(function(loadedpage) {
            expect(loadedpage.locale).to.equal("en_US");
            expect(loadedpage.title).to.equal("title en");
            expect(loadedpage.visibility).to.equal(true);

            Page.find({ where: { id: createdpage.id, locale: "de_AT" } }).success(function(loadedpage) {
              expect(loadedpage.locale).to.equal("de_AT");
              expect(loadedpage.title).to.equal("title de");
              expect(loadedpage.visibility).to.equal(true);

              done();
            });

          });
        });
      });
    });
  });
  
});